// 💳 支払い処理API
// 目的: お客さんが商品代金を支払う時の処理
// 使用場面: 支払い画面で「支払い完了」ボタンが押された時
export const processOrderPayment = async (
  req: Request,
  res: Response
): Promise<void> => {
  // ルート到達確認ログ（デバッグ用）
  console.log("processOrderPayment called", req.params.id);
  try {
    const orderId = parseInt(req.params.id, 10);
    if (isNaN(orderId)) {
      res.status(400).json({ success: false, message: "不正な注文IDです" });
      return;
    }

    // 許可された支払い方法リスト
    const allowedMethods = ["現金", "クレジット"];
    let paymentMethod = req.body.paymentMethod;
    if (!allowedMethods.includes(paymentMethod)) {
      paymentMethod = "現金";
    }

    // 注文の存在確認
    const orderResult = await db.query(
      "SELECT * FROM orders WHERE order_id = $1",
      [orderId]
    );
    if (orderResult.rows.length === 0) {
      res.status(404).json({ success: false, message: "注文が見つかりません" });
      return;
    }

    // 支払い情報の更新
    await db.query(
      "UPDATE orders SET payment_status = '支払済み', payment_method = $1, updated_at = NOW() WHERE order_id = $2",
      [paymentMethod, orderId]
    );

    // 必要ならSocket.io等で通知も可能

    res.json({ success: true, message: "支払いが完了しました" });
  } catch (error) {
    console.error("支払い処理エラー:", error);
    res
      .status(500)
      .json({ success: false, message: "支払い処理に失敗しました" });
  }
};
import { Request, Response } from "express";
import { db } from "../database/connection";
import { Order, OrderItem } from "../types/index";
import QRCode from "qrcode";
import { Server } from "socket.io";

/**
 * 📋 注文管理コントローラー
 * 目的: 注文に関する全ての処理を管理する「司令塔」
 * 機能: 注文の作成、更新、状態管理を行う
 * 特徴: Socket.io リアルタイム通信と連携（画面が自動更新される）
 * 初心者向け説明: このファイルは「注文の取り扱い説明書」のようなもので、
 *                お客さんが注文してから商品を受け取るまでの全ての手順が書かれています
 */

// 📡 Socket.ioインスタンスを保持
// 目的: リアルタイム通信の「電話回線」を保存しておく場所
let socketInstance: Server | null = null;

// 📡 Socket.io設定関数
// 目的: リアルタイム通信の準備をする
export const setSocketInstance = (io: Server) => {
  socketInstance = io;
};

// 📢 Socket.io通知を送信するヘルパー関数
// 目的: 全ての画面に「お知らせ」を送信する（例: 新しい注文が入りました）
// 使用例: 注文が入ったら厨房画面に自動で表示される
const emitSocketNotification = (event: string, data: any) => {
  if (socketInstance) {
    socketInstance.emit(event, {
      ...data,
      timestamp: new Date().toISOString(), // いつ送信したかの時刻を追加
    });
  }
};

// 📊 全注文を取得（管理者向け）
// 目的: 管理者が全ての注文を一覧で見るための機能
// 使用場面: 履歴画面、売上管理画面
// 機能: フィルター機能付き（支払い状況別、ステータス別など）
export const getAllOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { status, payment_status, limit = 50, offset = 0 } = req.query;

    let whereClause = "WHERE 1=1";
    const params: any[] = [];
    let paramCount = 0;

    if (status) {
      paramCount++;
      whereClause += ` AND o.status = $${paramCount}`;
      params.push(status);
    }

    if (payment_status) {
      paramCount++;
      whereClause += ` AND o.payment_status = $${paramCount}`;
      params.push(payment_status);
    }

    paramCount++;
    const limitValue = paramCount;
    params.push(Number(limit));

    paramCount++;
    const offsetValue = paramCount;
    params.push(Number(offset));

    const query = `
      SELECT
        o.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'order_item_id', oi.order_item_id,
              'product_id', oi.product_id,
              'product_name', oi.product_name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price,
              'toppings', oi.toppings,
              'cooking_time', oi.cooking_time,
              'cooking_instruction', oi.cooking_instruction
            )
          ) FILTER (WHERE oi.order_item_id IS NOT NULL),
          '[]'::json
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      ${whereClause}
      GROUP BY o.order_id
      ORDER BY o.created_at DESC
      LIMIT $${limitValue} OFFSET $${offsetValue}
    `;

    const result = await db.query(query, params);

    // 合計件数も取得
    const countQuery = `SELECT COUNT(*) FROM orders o ${whereClause
      .replace(/\$\d+/g, (match, offset) => {
        const paramIndex = parseInt(match.substring(1)) - 1;
        return params[paramIndex] !== undefined ? `$${paramIndex + 1}` : match;
      })
      .replace("LIMIT.*", "")}`;

    const countParams = params.slice(0, -2); // limit と offset を除く
    const countResult = await db.query(countQuery, countParams);

    res.json({
      success: true,
      data: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].count),
        limit: Number(limit),
        offset: Number(offset),
      },
    });
  } catch (error) {
    console.error("注文一覧取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "注文データの取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 🔍 特定注文の詳細を取得
// 目的: 1つの注文の詳しい情報を取得する
// 使用場面: 注文詳細画面、管理者がトラブル対応する時
// 取得情報: 注文番号、商品内容、支払い状況、調理状況など
export const getOrderById = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const query = `
      SELECT
        o.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'order_item_id', oi.order_item_id,
              'product_id', oi.product_id,
              'product_name', oi.product_name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price,
              'toppings', oi.toppings,
              'cooking_time', oi.cooking_time,
              'cooking_instruction', oi.cooking_instruction
            )
          ) FILTER (WHERE oi.order_item_id IS NOT NULL),
          '[]'::json
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_id = $1
      GROUP BY o.order_id
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "注文が見つかりません",
      });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("注文詳細取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "注文詳細の取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 📱 注文番号で注文を取得（お客様向け）
// 目的: お客さんが注文番号を使って自分の注文状況を確認する
// 使用場面: QRコードを読み取った時、注文状況確認画面
// 表示内容: 待ち時間、調理状況、「もうすぐ出来上がり」など
export const getOrderByNumber = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { orderNumber } = req.params;

    const query = `
      SELECT
        o.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'order_item_id', oi.order_item_id,
              'product_id', oi.product_id,
              'product_name', oi.product_name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price,
              'toppings', oi.toppings,
              'cooking_time', oi.cooking_time
            )
          ) FILTER (WHERE oi.order_item_id IS NOT NULL),
          '[]'::json
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.order_number = $1
      GROUP BY o.order_id
    `;

    const result = await db.query(query, [orderNumber]);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "注文が見つかりません",
      });
      return;
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error("注文番号検索エラー:", error);
    res.status(500).json({
      success: false,
      message: "注文の検索に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 🆕 新規注文を作成
// 目的: お客さんが注文ボタンを押した時に、注文をデータベースに保存する
// 処理内容: 商品価格計算、在庫チェック、注文番号生成、QRコード作成
// 重要: この処理が成功すると、厨房画面に新しい注文が表示される
export const createOrder = async (
  req: Request,
  res: Response
): Promise<void> => {
  console.log("受信リクエストbody:", req.body);
  try {
    const {
      customer_id,
      items, // [{ product_id, quantity, toppings, cooking_instruction }]
      payment_method = "現金",
      special_instructions,
    } = req.body;

    // バリデーション
    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({
        success: false,
        message: "注文商品が指定されていません",
      });
      return;
    }

    const client = await db.getClient();
    try {
      await client.query("BEGIN");

      // 注文番号をDB関数で生成
      const now = new Date();

      // 商品情報を取得して価格計算
      let totalAmount = 0;
      const orderItems = [];

      for (const item of items) {
        const productQuery = `
          SELECT product_id, product_name, price, cooking_time, stock_quantity, auto_disable_on_zero
          FROM products
          WHERE product_id = $1 AND status = '有効' AND deleted_flag = false
        `;
        const productResult = await client.query(productQuery, [
          item.product_id,
        ]);

        if (productResult.rows.length === 0) {
          throw new Error(
            `商品ID ${item.product_id} が見つからないか、販売停止中です`
          );
        }

        const product = productResult.rows[0];
        const productPrice = parseFloat(product.price);

        // 在庫チェック
        if (product.stock_quantity < item.quantity) {
          throw new Error(
            `商品「${product.product_name}」の在庫が不足しています`
          );
        }

        // トッピング価格計算
        let toppingTotal = 0;
        if (item.toppings && item.toppings.length > 0) {
          const toppingQuery = `
            SELECT topping_id, price
            FROM toppings
            WHERE topping_id = ANY($1) AND is_active = true
          `;
          const toppingResult = await client.query(toppingQuery, [
            item.toppings.map((t: any) => t.topping_id),
          ]);

          for (const topping of item.toppings) {
            const toppingData = toppingResult.rows.find(
              (t) => t.topping_id === topping.topping_id
            );
            if (toppingData) {
              toppingTotal += toppingData.price;
            }
          }
        }

        const itemTotal = (productPrice + toppingTotal) * item.quantity;
        totalAmount += itemTotal;

        orderItems.push({
          product_id: product.product_id,
          product_name: product.product_name,
          quantity: item.quantity,
          unit_price: productPrice + toppingTotal,
          total_price: itemTotal,
          toppings: item.toppings || [],
          cooking_time: product.cooking_time,
          cooking_instruction: item.cooking_instruction || null,
        });

        // 在庫更新はDBトリガーに任せるため、ここのロジックは削除
      }

      // 推定調理時間を計算
      const maxCookingTime = Math.max(
        ...orderItems.map((item) => item.cooking_time)
      );
      const estimatedPickupTime = new Date(
        now.getTime() + maxCookingTime * 60000
      );

      // 注文レコードを作成
      const orderQuery = `
        INSERT INTO orders (
          customer_id, order_number, total_amount, status, payment_status,
          payment_method, estimated_pickup_time, special_instructions
        )
        VALUES ($1, generate_order_number(), $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const orderValues = [
        customer_id || null,
        totalAmount,
        "注文受付",
        "未払い",
        payment_method,
        estimatedPickupTime,
        special_instructions || null,
      ];

      const orderResult = await client.query(orderQuery, orderValues);
      const order = orderResult.rows[0];
      const orderNumber = order.order_number; // DBから返された注文番号を使用

      // 注文商品を保存
      for (const item of orderItems) {
        const itemQuery = `
          INSERT INTO order_items (
            order_id, product_id, product_name, quantity, unit_price,
            total_price, toppings, cooking_time, cooking_instruction
          )
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        `;

        await client.query(itemQuery, [
          order.order_id,
          item.product_id,
          item.product_name,
          item.quantity,
          item.unit_price,
          item.total_price,
          JSON.stringify(item.toppings),
          item.cooking_time,
          item.cooking_instruction,
        ]);
      }

      // QRコード生成（小さいサイズで生成）
      const qrCodeData = `${process.env.FRONTEND_URL}/order/${orderNumber}`;
      const qrCodeDataURL = await QRCode.toDataURL(qrCodeData, {
        width: 200,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });

      // QRコードをDBに保存
      await client.query(`UPDATE orders SET qr_code = $1 WHERE order_id = $2`, [
        qrCodeDataURL,
        order.order_id,
      ]);

      await client.query("COMMIT");

      // 完成した注文データを取得（QRコードを含まない軽量版）
      const finalOrderQuery = `
        SELECT
          o.order_id,
          o.order_number,
          o.customer_id,
          o.total_amount,
          o.status,
          o.payment_status,
          o.payment_method,
          o.estimated_pickup_time,
          o.created_at,
          COALESCE(
            JSON_AGG(
              JSON_BUILD_OBJECT(
                'order_item_id', oi.order_item_id,
                'product_id', oi.product_id,
                'product_name', oi.product_name,
                'quantity', oi.quantity,
                'unit_price', oi.unit_price,
                'total_price', oi.total_price,
                'toppings', oi.toppings,
                'cooking_time', oi.cooking_time,
                'cooking_instruction', oi.cooking_instruction
              )
            ) FILTER (WHERE oi.order_item_id IS NOT NULL),
            '[]'::json
          ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.order_id = oi.order_id
        WHERE o.order_id = $1
        GROUP BY o.order_id
      `;

      const finalResult = await db.query(finalOrderQuery, [order.order_id]);
      const orderData = finalResult.rows[0];

      // 注文受付のソケット通知
      emitSocketNotification("order_placed", {
        order_id: order.order_id,
        order_number: orderNumber,
        customer_id: customer_id || null,
        total_amount: totalAmount,
        status: "注文受付",
        payment_status: "未払い",
        items: orderItems,
      });

      // レスポンスにはQRコードを含めない（別途APIで取得）
      res.status(201).json({
        success: true,
        message: "注文が正常に作成されました",
        data: {
          ...orderData,
          qr_code_url: `/api/orders/${orderNumber}/qr`,
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("注文作成エラー:", error);
    res.status(500).json({
      success: false,
      message:
        error instanceof Error ? error.message : "注文の作成に失敗しました",
    });
  }
};

// 🔄 注文ステータスを更新
// 目的: 注文の状況を変更する（調理中→調理完了など）
// 使用場面: 厨房で「調理開始」「調理完了」ボタンを押した時
// 自動処理: 時刻の記録、リアルタイム通知の送信
export const updateOrderStatus = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { status, payment_status, cancel_reason } = req.body;

    // ステータス更新のバリデーション
    const validStatuses = [
      "注文受付",
      "調理待ち",
      "調理中",
      "調理完了",
      "受け取り済み",
      "キャンセル",
    ];
    const validPaymentStatuses = ["未払い", "支払済み"];

    if (status && !validStatuses.includes(status)) {
      res.status(400).json({
        success: false,
        message: "無効なステータスです",
      });
      return;
    }

    if (payment_status && !validPaymentStatuses.includes(payment_status)) {
      res.status(400).json({
        success: false,
        message: "無効な支払いステータスです",
      });
      return;
    }

    const updateFields: string[] = [];
    const values: any[] = [id];
    let paramCount = 1;

    if (status) {
      paramCount++;
      updateFields.push(`status = $${paramCount}`);
      values.push(status);

      // 調理開始時間・完了時間・受け取り時間の自動設定
      if (status === "調理中") {
        paramCount++;
        updateFields.push(`cooking_start_time = $${paramCount}`);
        values.push(new Date());
      } else if (status === "調理完了") {
        paramCount++;
        updateFields.push(`cooking_completion_time = $${paramCount}`);
        values.push(new Date());
      } else if (status === "受け取り済み") {
        paramCount++;
        updateFields.push(`actual_pickup_time = $${paramCount}`);
        values.push(new Date());
      }
    }

    if (payment_status) {
      paramCount++;
      updateFields.push(`payment_status = $${paramCount}`);
      values.push(payment_status);
    }

    if (cancel_reason) {
      paramCount++;
      updateFields.push(`cancel_reason = $${paramCount}`);
      values.push(cancel_reason);
    }

    if (updateFields.length === 0) {
      res.status(400).json({
        success: false,
        message: "更新する項目がありません",
      });
      return;
    }

    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    values.push(new Date());

    const query = `
      UPDATE orders
      SET ${updateFields.join(", ")}
      WHERE order_id = $1
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      res.status(404).json({
        success: false,
        message: "注文が見つかりません",
      });
      return;
    }

    // ステータス更新のソケット通知
    emitSocketNotification("order_status_updated", {
      order_id: id,
      status: status,
      payment_status: payment_status || null,
    });

    res.json({
      success: true,
      message: "注文ステータスが更新されました",
      data: result.rows[0],
    });
  } catch (error) {
    console.error("注文ステータス更新エラー:", error);
    res.status(500).json({
      success: false,
      message: "注文ステータスの更新に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 👨‍🍳 調理中の注文一覧を取得（厨房向け）
// 目的: 厨房画面で「今作るべき注文」を表示する
// 表示内容: 調理待ち、調理中の注文を古い順に表示
// 使用場面: 厨房スタッフが次に何を作るかを確認する時
export const getCookingOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query = `
      SELECT
        o.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'order_item_id', oi.order_item_id,
              'product_id', oi.product_id,
              'product_name', oi.product_name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price,
              'toppings', oi.toppings,
              'cooking_time', oi.cooking_time,
              'cooking_instruction', oi.cooking_instruction
            )
          ) FILTER (WHERE oi.order_item_id IS NOT NULL),
          '[]'::json
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.status IN ('調理待ち', '調理中')
      GROUP BY o.order_id
      ORDER BY o.created_at ASC
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("調理中注文取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "調理中注文の取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 📦 受け渡し待ちの注文一覧を取得
// 目的: 調理が完了して、お客さんに渡す準備ができた注文を表示
// 条件: 「調理完了」かつ「支払済み」の注文のみ
// 使用場面: 受け渡し画面で、どの注文を渡すかを確認する時
export const getReadyOrders = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const query = `
      SELECT
        o.*,
        COALESCE(
          JSON_AGG(
            JSON_BUILD_OBJECT(
              'order_item_id', oi.order_item_id,
              'product_id', oi.product_id,
              'product_name', oi.product_name,
              'quantity', oi.quantity,
              'unit_price', oi.unit_price,
              'total_price', oi.total_price,
              'toppings', oi.toppings
            )
          ) FILTER (WHERE oi.order_item_id IS NOT NULL),
          '[]'::json
        ) as items
      FROM orders o
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      WHERE o.status = '調理完了' AND o.payment_status = '支払済み'
      GROUP BY o.order_id
      ORDER BY o.cooking_completion_time ASC
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("受け渡し待ち注文取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "受け渡し待ち注文の取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 📈 売上統計を取得
// 目的: 今日の売上、注文数、人気商品などの統計情報を計算
// 表示内容: 売上合計、注文数、商品別売上、キャンセル数など
// 使用場面: 店舗監視画面、売上管理画面
export const getSalesStats = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { startDate, endDate } = req.query;

    let dateFilter = "";
    const params: any[] = [];

    if (startDate && endDate) {
      dateFilter = "AND o.created_at >= $1 AND o.created_at <= $2";
      params.push(startDate, endDate);
    }

    const query = `
      SELECT
        COUNT(*) as total_orders,
        SUM(CASE WHEN o.status = '受け取り済み' THEN o.total_amount ELSE 0 END) as total_sales,
        SUM(CASE WHEN o.status = 'キャンセル' THEN 1 ELSE 0 END) as cancelled_orders,
        AVG(CASE WHEN o.status = '受け取り済み' THEN o.total_amount ELSE NULL END) as average_order_value,
        COUNT(CASE WHEN o.status IN ('調理待ち', '調理中') THEN 1 ELSE NULL END) as pending_orders,
        COUNT(CASE WHEN o.status = '調理完了' THEN 1 ELSE NULL END) as ready_orders
      FROM orders o
      WHERE 1=1 ${dateFilter}
    `;

    const statsResult = await db.query(query, params);

    // 商品別売上統計
    const productStatsQuery = `
      SELECT
        oi.product_name,
        SUM(oi.quantity) as total_quantity,
        SUM(oi.total_price) as total_revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.order_id
      WHERE o.status = '受け取り済み' ${dateFilter}
      GROUP BY oi.product_name
      ORDER BY total_quantity DESC
    `;

    const productStatsResult = await db.query(productStatsQuery, params);

    res.json({
      success: true,
      data: {
        overview: statsResult.rows[0],
        product_stats: productStatsResult.rows,
      },
    });
  } catch (error) {
    console.error("売上統計取得エラー:", error);
    res.status(500).json({
      success: false,
      message: "売上統計の取得に失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// 🗑️ 注文履歴をリセット（管理者専用）
// 目的: 全ての注文データを削除して、新しい日の営業準備をする
// 危険: 全てのデータが消去されるので、管理者だけが使用可能
// 使用場面: 営業終了後、翌日の営業準備時
export const resetOrderHistory = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    console.log("📝 注文履歴リセット開始");

    const client = await db.getClient();
    
    try {
      await client.query("BEGIN");

      // 注文関連テーブルをクリア（外部キー制約を考慮した順序）
      console.log("🗑️ 注文アイテムを削除中...");
      const deleteItemsResult = await client.query("DELETE FROM order_items");
      
      console.log("🗑️ 注文を削除中...");
      const deleteOrdersResult = await client.query("DELETE FROM orders");

      // シーケンス（auto increment）をリセット
      console.log("🔢 IDシーケンスをリセット中...");
      await client.query("ALTER SEQUENCE IF EXISTS orders_order_id_seq RESTART WITH 1");
      await client.query("ALTER SEQUENCE IF EXISTS order_items_order_item_id_seq RESTART WITH 1");

      await client.query("COMMIT");

      console.log(`✅ 注文履歴リセット完了: 注文${deleteOrdersResult.rowCount}件、アイテム${deleteItemsResult.rowCount}件を削除`);

      // 確認用のカウント取得
      const orderCount = await client.query("SELECT COUNT(*) FROM orders");
      const itemCount = await client.query("SELECT COUNT(*) FROM order_items");
      const productCount = await client.query("SELECT COUNT(*) FROM products");

      res.json({
        success: true,
        message: "注文履歴のリセットが完了しました",
        data: {
          deletedOrders: deleteOrdersResult.rowCount,
          deletedItems: deleteItemsResult.rowCount,
          remainingOrders: parseInt(orderCount.rows[0].count),
          remainingItems: parseInt(itemCount.rows[0].count),
          preservedProducts: parseInt(productCount.rows[0].count),
        },
      });
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("❌ 注文履歴リセットエラー:", error);
    res.status(500).json({
      success: false,
      message: "注文履歴のリセットに失敗しました",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

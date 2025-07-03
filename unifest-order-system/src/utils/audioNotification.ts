// 音声通知システム
export class AudioNotificationService {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.7;

  constructor() {
    this.initializeAudioContext();
  }

  private async initializeAudioContext() {
    try {
      // Web Audio APIを初期化
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      this.audioContext = new AudioContextClass();
    } catch (error) {
      console.warn("Audio context initialization failed:", error);
    }
  }

  // 音声通知の有効/無効を設定
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  // 音量を設定（0.0 - 1.0）
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  // ビープ音を生成
  private createBeepTone(
    frequency: number,
    duration: number,
    volume: number = this.volume
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.audioContext || !this.isEnabled) {
        resolve();
        return;
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.setValueAtTime(
        frequency,
        this.audioContext.currentTime
      );
      oscillator.type = "sine";

      gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
      gainNode.gain.linearRampToValueAtTime(
        volume,
        this.audioContext.currentTime + 0.01
      );
      gainNode.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioContext.currentTime + duration
      );

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);

      oscillator.onended = () => resolve();
    });
  }

  // 調理完了通知音
  async playOrderReady(orderNumber: string) {
    if (!this.isEnabled) return;

    // 3回のビープ音
    await this.createBeepTone(800, 0.2);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await this.createBeepTone(800, 0.2);
    await new Promise((resolve) => setTimeout(resolve, 100));
    await this.createBeepTone(800, 0.2);

    // 音声メッセージ（利用可能な場合）
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(
        `注文番号${orderNumber}の調理が完了しました`
      );
      utterance.lang = "ja-JP";
      utterance.volume = this.volume;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      speechSynthesis.speak(utterance);
    }
  }

  // 緊急通知音
  async playEmergencyAlert() {
    if (!this.isEnabled) return;

    // 緊急用のアラート音（高音・長音）
    for (let i = 0; i < 5; i++) {
      await this.createBeepTone(1000, 0.3, this.volume * 1.2);
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(
        "緊急停止が実行されました"
      );
      utterance.lang = "ja-JP";
      utterance.volume = this.volume;
      utterance.rate = 1.2;
      utterance.pitch = 1.2;
      speechSynthesis.speak(utterance);
    }
  }

  // 新しい注文通知音
  async playNewOrder() {
    if (!this.isEnabled) return;

    await this.createBeepTone(600, 0.15);
    await new Promise((resolve) => setTimeout(resolve, 50));
    await this.createBeepTone(800, 0.15);
  }

  // 受け渡し遅延アラート
  async playDelayAlert(orderNumber: string) {
    if (!this.isEnabled) return;

    // 注意喚起音
    await this.createBeepTone(400, 0.5);
    await new Promise((resolve) => setTimeout(resolve, 200));
    await this.createBeepTone(400, 0.5);

    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(
        `注文番号${orderNumber}の受け渡しが遅れています`
      );
      utterance.lang = "ja-JP";
      utterance.volume = this.volume;
      speechSynthesis.speak(utterance);
    }
  }

  // カスタム通知音
  async playCustomNotification(
    message: string,
    frequency: number = 700,
    beepCount: number = 2
  ) {
    if (!this.isEnabled) return;

    for (let i = 0; i < beepCount; i++) {
      await this.createBeepTone(frequency, 0.2);
      if (i < beepCount - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    if ("speechSynthesis" in window && message) {
      const utterance = new SpeechSynthesisUtterance(message);
      utterance.lang = "ja-JP";
      utterance.volume = this.volume;
      speechSynthesis.speak(utterance);
    }
  }

  // Web Audio APIの再開（ユーザーインタラクション後）
  async resumeAudioContext() {
    if (this.audioContext && this.audioContext.state === "suspended") {
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.warn("Failed to resume audio context:", error);
      }
    }
  }

  // リソースをクリーンアップ
  dispose() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// シングルトンインスタンス
export const audioNotificationService = new AudioNotificationService();

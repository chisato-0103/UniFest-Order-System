import type { ReactNode } from "react";
import { Container } from "@mui/material";

interface PageLayoutProps {
  children: ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  sx?: object;
}

/**
 * ページ共通レイアウトコンポーネント
 * AppBarの高さ分のパディングを自動で設定
 */
const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  maxWidth = "xl",
  sx = {},
}) => {
  return (
    <Container
      maxWidth={maxWidth}
      sx={{
        pt: { xs: 7, sm: 8 }, // AppBarの高さ分のパディング
        py: 3,
        px: { xs: 2, sm: 3 },
        ...sx,
      }}
    >
      {children}
    </Container>
  );
};

export default PageLayout;

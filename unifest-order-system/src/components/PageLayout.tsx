import type { ReactNode } from "react";
import { Container, Typography } from "@mui/material";

interface PageLayoutProps {
  children: ReactNode;
  title?: string;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  sx?: object;
}

/**
 * ページ共通レイアウトコンポーネント
 * AppBarの高さ分のパディングを自動で設定
 */
const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
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
      {title && (
        <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
          {title}
        </Typography>
      )}
      {children}
    </Container>
  );
};

export default PageLayout;

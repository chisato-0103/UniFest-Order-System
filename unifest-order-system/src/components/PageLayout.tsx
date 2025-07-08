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
        pt: { xs: 6, sm: 8 },
        py: { xs: 2, sm: 4 },
        px: { xs: 1, sm: 3 },
        borderRadius: { xs: 0, sm: 6 },
        boxShadow: { xs: "none", sm: "0 8px 32px rgba(80,80,180,0.10)" },
        background: {
          xs: "linear-gradient(135deg, #fff 0%, #f8f9fa 100%)",
          sm: "linear-gradient(135deg, #f8f9fa 0%, #e3e8ff 100%)",
        },
        minHeight: { xs: "100vh", sm: 600 },
        ...sx,
      }}
    >
      {title && (
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            mb: 3,
            color: "#3a3a7a",
            textShadow: "0 2px 8px #e3e8ff",
            fontSize: { xs: "2rem", sm: "2.5rem" },
          }}
        >
          {title}
        </Typography>
      )}
      {children}
    </Container>
  );
};

export default PageLayout;

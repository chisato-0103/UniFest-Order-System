import React from "react";
import {
  Box,
  Typography,
  Paper,
  Container,
  Chip,
  Avatar,
  Zoom,
} from "@mui/material";
import {
  Restaurant as RestaurantIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Star as StarIcon,
} from "@mui/icons-material";

interface EnhancedHeaderProps {
  title?: string;
  subtitle?: string;
  showStoreInfo?: boolean;
}

const EnhancedHeader: React.FC<EnhancedHeaderProps> = ({
  title = "UniFest たこ焼き屋",
  subtitle = "熱々のたこ焼きをお楽しみください",
  showStoreInfo = true,
}) => {
  const storeInfo = {
    rating: 4.8,
    waitTime: "15-20分",
    location: "大学祭 A区画",
    specialties: ["たこ焼き", "焼きそば", "ドリンク"],
  };

  return (
    <Paper
      elevation={0}
      sx={{
        background:
          "linear-gradient(135deg, #FF6B35 0%, #F7931E 50%, #4ECDC4 100%)",
        color: "white",
        mb: 3,
        overflow: "hidden",
        position: "relative",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background:
            'url(\'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="2" fill="rgba(255,255,255,0.1)"/><circle cx="20" cy="20" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="80" cy="30" r="1.5" fill="rgba(255,255,255,0.1)"/><circle cx="30" cy="80" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="70" cy="70" r="1.5" fill="rgba(255,255,255,0.1)"/></svg>\') repeat',
          opacity: 0.3,
        },
      }}
    >
      <Container
        maxWidth="lg"
        sx={{ py: { xs: 4, sm: 6 }, position: "relative", zIndex: 1 }}
      >
        <Box sx={{ textAlign: "center", mb: showStoreInfo ? 4 : 0 }}>
          {/* メインロゴ */}
          <Zoom in={true} timeout={800}>
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                mb: 2,
                p: 2,
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                borderRadius: 3,
                backdropFilter: "blur(10px)",
              }}
            >
              <Avatar
                sx={{
                  width: 60,
                  height: 60,
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  mr: 2,
                }}
              >
                <RestaurantIcon sx={{ fontSize: 32, color: "white" }} />
              </Avatar>
              <Box sx={{ textAlign: "left" }}>
                <Typography
                  variant="h3"
                  sx={{
                    fontWeight: 700,
                    fontSize: { xs: "1.8rem", sm: "2.5rem" },
                    mb: 0.5,
                  }}
                >
                  {title}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    opacity: 0.9,
                    fontSize: { xs: "1rem", sm: "1.2rem" },
                    fontWeight: 400,
                  }}
                >
                  {subtitle}
                </Typography>
              </Box>
            </Box>
          </Zoom>

          {/* 店舗情報 */}
          {showStoreInfo && (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 2,
                mt: 3,
              }}
            >
              <Zoom in={true} timeout={1000}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: 2,
                    py: 1,
                    px: 2,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <StarIcon sx={{ fontSize: 20, mr: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {storeInfo.rating} ★
                  </Typography>
                </Box>
              </Zoom>

              <Zoom in={true} timeout={1200}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: 2,
                    py: 1,
                    px: 2,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <TimeIcon sx={{ fontSize: 20, mr: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {storeInfo.waitTime}
                  </Typography>
                </Box>
              </Zoom>

              <Zoom in={true} timeout={1400}>
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    borderRadius: 2,
                    py: 1,
                    px: 2,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <LocationIcon sx={{ fontSize: 20, mr: 1 }} />
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {storeInfo.location}
                  </Typography>
                </Box>
              </Zoom>
            </Box>
          )}

          {/* 専門料理タグ */}
          {showStoreInfo && (
            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "center",
                gap: 1,
                mt: 3,
              }}
            >
              {storeInfo.specialties.map((specialty, index) => (
                <Zoom key={specialty} in={true} timeout={1600 + index * 200}>
                  <Chip
                    label={specialty}
                    sx={{
                      backgroundColor: "rgba(255, 255, 255, 0.2)",
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      "&:hover": {
                        backgroundColor: "rgba(255, 255, 255, 0.3)",
                      },
                    }}
                  />
                </Zoom>
              ))}
            </Box>
          )}
        </Box>
      </Container>
    </Paper>
  );
};

export default EnhancedHeader;

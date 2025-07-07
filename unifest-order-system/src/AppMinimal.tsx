import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { Box } from "@mui/material";
import CssBaseline from "@mui/material/CssBaseline";
import { SimpleAppProvider } from "./contexts/SimpleAppContext";
import SimpleOrderPage from "./pages/SimpleOrderPage";

// MUIテーマ設定
const theme = createTheme({
  palette: {
    primary: {
      main: "#FF6B35", // たこ焼きっぽいオレンジ色
    },
    secondary: {
      main: "#4ECDC4", // 爽やかな青緑
    },
    background: {
      default: "#F7F7F7",
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <SimpleAppProvider>
        <Router>
          <Box
            component="main"
            sx={{
              minHeight: "100vh",
              backgroundColor: "background.default",
            }}
          >
            <Routes>
              <Route path="/" element={<SimpleOrderPage />} />
            </Routes>
          </Box>
        </Router>
      </SimpleAppProvider>
    </ThemeProvider>
  );
}

export default App;

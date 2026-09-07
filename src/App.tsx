import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import { RedirectIfAuthenticated, RequireAuth } from "./auth/guards";
import { LoginPage } from "./pages/LoginPage";
import { PostEditorPage } from "./pages/PostEditorPage";
import { PostsPage } from "./pages/PostsPage";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<RedirectIfAuthenticated />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
          <Route element={<RequireAuth />}>
            <Route path="/" element={<PostsPage />} />
            <Route path="/posts/new" element={<PostEditorPage />} />
            <Route path="/posts/:id" element={<PostEditorPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

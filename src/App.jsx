import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import Room from "./pages/Room";
import "./App.css"
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 홈 */}
        <Route path="/" element={<Home />} />

        {/* 방 만들기 */}
        <Route path="/create" element={<CreateRoom />} />

        {/* 방 참여 */}
        <Route path="/join" element={<JoinRoom />} />

        {/* 방 내부 */}
        <Route path="/room/:roomId" element={<Room />} />
      </Routes>
    </BrowserRouter>
  );
}

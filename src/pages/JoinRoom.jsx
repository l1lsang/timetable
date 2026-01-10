import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { v4 as uuidv4 } from "uuid";

import { db } from "../firebase";
import { hashPassword } from "../utils/hash";

export default function JoinRoom() {
  const navigate = useNavigate();

  const [roomId, setRoomId] = useState("");
  const [nickname, setNickname] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!roomId.trim() || !nickname.trim()) {
      alert("방 코드랑 닉네임은 꼭 입력해줘요 🙂");
      return;
    }

    setLoading(true);

    try {
      const upperRoomId = roomId.trim().toUpperCase();
      const roomRef = doc(db, "rooms", upperRoomId);
      const roomSnap = await getDoc(roomRef);

      if (!roomSnap.exists()) {
        alert("앗… 그런 방은 없는 것 같아요 🥲");
        return;
      }

      const room = roomSnap.data();

      // 🔐 비밀번호 검증
      if (room.passwordHash) {
        const inputHash = hashPassword(password);
        if (inputHash !== room.passwordHash) {
          alert("비밀번호가 맞지 않아요 😢");
          return;
        }
      }

      // 👤 익명 유저 등록
      const userId = uuidv4();
      await setDoc(doc(db, "rooms", upperRoomId, "members", userId), {
        nickname: nickname.trim(),
        joinedAt: serverTimestamp(),
      });

      // 🔑 로컬 저장
      localStorage.setItem("roomId", upperRoomId);
      localStorage.setItem("userId", userId);
      localStorage.setItem("nickname", nickname.trim());

      navigate(`/room/${upperRoomId}`);
    } catch (error) {
      console.error("❌ 방 참여 오류:", error);
      alert("방에 들어가는 데 실패했어요 🥲");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="center-wrap">
        <div className="card">
          <h2 className="title">🔑 초대받은 방 들어가기</h2>
          <p className="desc">
            친구한테 받은 방 코드로 바로 들어갈 수 있어요
          </p>

          <input
            className="input"
            placeholder="방 코드 (예: AB3KQ9)"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
          />

          <input
            className="input"
            placeholder="내 닉네임"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />

          <input
            className="input"
            type="password"
            placeholder="비밀번호 (있다면)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            className="btn-primary"
            onClick={handleJoin}
            disabled={loading}
          >
            {loading ? "들어가는 중이에요…" : "방 들어가기"}
          </button>
        </div>
      </div>
    </div>
  );
}

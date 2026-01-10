import { useEffect, useMemo, useState, Fragment } from "react";
import { useParams } from "react-router-dom";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase";
import Timetable from "../Timetable"; // 우리가 만든 시간표

export default function Room() {
  const { roomId } = useParams();

  const userId = localStorage.getItem("userId");
  const nickname = localStorage.getItem("nickname");

  const [members, setMembers] = useState([]);
  const [allSelections, setAllSelections] = useState([]);

  /* =========================
     👥 멤버 실시간 구독
  ========================= */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "rooms", roomId, "members"),
      (snap) => {
        setMembers(
          snap.docs.map((d) => ({
            id: d.id,
            ...d.data(),
          }))
        );
      }
    );
    return unsub;
  }, [roomId]);

  /* =========================
     ⏰ 시간 선택 실시간 구독
  ========================= */
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "rooms", roomId, "availability"),
      (snap) => {
        setAllSelections(
          snap.docs.map((d) => d.data().selected || [])
        );
      }
    );
    return unsub;
  }, [roomId]);

  /* =========================
     📊 히트맵 계산
  ========================= */
  const heatmap = useMemo(() => {
    const map = {};
    allSelections.forEach((arr) => {
      arr.forEach((k) => {
        map[k] = (map[k] || 0) + 1;
      });
    });
    return map;
  }, [allSelections]);

  /* =========================
     🏆 TOP 3
  ========================= */
  const top3 = Object.entries(heatmap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  /* =========================
     🔄 내 시간 저장 함수
  ========================= */
  const saveMySelection = async (selectedSet) => {
    if (!userId) return;

    await setDoc(
      doc(db, "rooms", roomId, "availability", userId),
      {
        selected: Array.from(selectedSet),
        updatedAt: serverTimestamp(),
      }
    );
  };

  return (
    <div className="page">
      <div className="top-bar">
        <h2>🏠 방: {roomId}</h2>
        <span>👤 {nickname}</span>
      </div>

      <div className="content">
        {/* 📅 시간표 */}
        <div className="timetable-wrapper">
          <Timetable
            heatmap={heatmap}
            onChange={saveMySelection}
          />
        </div>

        {/* 👥 사이드 패널 */}
        <div className="side-panel">
          <h3>👥 참여자</h3>
          {members.map((m) => (
            <p key={m.id}>• {m.nickname}</p>
          ))}

          <h3 style={{ marginTop: 20 }}>🔥 TOP 3</h3>
          {top3.map(([key, count]) => (
            <p key={key}>
              {key} → {count}명
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}

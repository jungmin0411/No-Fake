import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// 우리가 만든 컴포넌트들
import NikeWebsite from './Nike'           // 1단계: 나이키 홈 페이지 
import NikeRaffle from './NikeRaffle';           // 2단계: 나이키 래플 페이지
import Login from './user/pages/KakaoLogin';  // 3단계: 카카오 로그인
import UserDashboard from './user/UserDashboard'; // 4단계: 사용자 대시보드
import KakaoCallback from './user/pages/KakaoCallback'; // 로그인 처리 콜백

import AdminDashboard from './admin/AdminDashboard'; // 관리자 대시보드 (통계 및 목록)
import NoFakeDashboard from './admin/Raffle';    // 관리자 래플 상세 관리 (기존 이미지의 그 화면)

function App() {

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* 사용자 흐름 */}
          {/* [1단계] 메인 나이키 홈 */}
          <Route path="/" element={<NikeWebsite />} />
 
          {/* [2단계] 래플 랜딩 페이지 */}
          <Route path="/raffle" element={<NikeRaffle />} />

          {/* [3단계] 인증: 카카오 로그인 페이지 */}
          <Route path="/login" element={<Login />} />
          
          {/* 카카오 인증 후 돌아오는 주소 (필요 시) */}
          <Route path="/auth/kakao/callback" element={<KakaoCallback />} />

          {/* [4단계] 목적지: 사용자 대시보드 */}
          <Route path="/dashboard/*" element={<Navigate to="/home" replace />} />
          <Route path="/home" element={<UserDashboard />} />
          <Route path="/participate/:slug" element={<UserDashboard />} />
          <Route path="/draw-status" element={<UserDashboard />} />
          <Route path="/my-wallet" element={<UserDashboard />} />
          <Route path="/puzzle-exchange" element={<UserDashboard />} />
          <Route path="/marketplace" element={<UserDashboard />} />
          <Route path="/transparency-center" element={<UserDashboard />} />

          {/* 관리자 흐름 */}
          {/* 1. 전체 상황판 (통계 및 목록) */}
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/AdminDashboard" element={<AdminDashboard />} />
          
          {/* 2. 개별 래플 상세 관리 (기존 이미지의 그 화면) */}
          <Route path="/admin/raffle/:id" element={<NoFakeDashboard />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;

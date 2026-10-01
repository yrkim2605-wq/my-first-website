import { useEffect } from 'react';
import Box from '@mui/material/Box';

// 모든 페이지에 함께 까는 공통 효과 (참고: seunghyuk.com)
// - 필름 노이즈: 화면 전체에 아주 옅은 입자를 깔아 인쇄물 같은 질감을 준다 (모양은 index.css의 .filmGrain)
// - 탭 제목: 다른 탭으로 떠나면 제목이 바뀌어 돌아오라고 부르고, 돌아오면 원래 제목으로 되돌린다

const AWAY_TITLE = 'Come back 👀';

const useAwayTitle = () => {
  useEffect(() => {
    let originalTitle = document.title;
    const handleVisibility = () => {
      if (document.hidden) {
        originalTitle = document.title;
        document.title = AWAY_TITLE;
      } else {
        document.title = originalTitle;
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);
};

const SiteEffects = () => {
  useAwayTitle();
  return <Box className="filmGrain" aria-hidden />;
};

export default SiteEffects;

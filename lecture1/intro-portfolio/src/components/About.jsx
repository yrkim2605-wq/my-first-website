import { useRef } from 'react';
import Box from '@mui/material/Box';
import { dpx } from '../constants/typography';
import Typography from '@mui/material/Typography';
import WhatIDo from './WhatIDo';
import FitStage from './FitStage';

// 데스크톱: 섹션을 화면에 고정해 두고, 이만큼(창 높이 %) 더 스크롤하는 동안 WHAT I DO 큐브가 구른다
const ROLL_VH = 120;

const About = () => {
  const sectionRef = useRef(null);

  return (
    <Box
      id="about"
      ref={sectionRef}
      sx={{ position: 'relative', height: { md: `calc(100svh + ${ROLL_VH}svh)` } }}
    >
      <FitStage
        ratio={[2000, 1026]}
        sx={{ bgcolor: '#ffffff', color: '#111111', position: { xs: 'relative', md: 'sticky' }, top: 0 }}
        stageSx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          pt: { xs: '16cqw', md: '7cqw' },
          pb: { xs: '16cqw', md: 0 },
        }}
      >
        <Typography
          component="h2"
          sx={{
            fontFamily: '"Anton", sans-serif',
            fontWeight: 400,
            fontSize: { xs: '12cqw', md: dpx(70) },
            lineHeight: { xs: 1.12, md: 1 },
            letterSpacing: '-0.02em',
          }}
        >
          FROM CURIOSITY,
          <br />
          INTO EXPERIENCE
        </Typography>

        <Typography
          sx={{
            mt: { xs: '3cqw', md: '1.2cqw' },
            fontFamily: '"Alumni Sans", sans-serif',
            fontWeight: 600,
            fontSize: { xs: '3.6cqw', md: dpx(20) },
            lineHeight: 1.25,
            letterSpacing: '-0.02em',
          }}
        >
          I EXPLORE IDEAS, SHAPE THEM VISUALLY,
          <br />
          AND TURN THEM INTO EXPERIENCES PEOPLE CAN SEE AND USE.
        </Typography>

        {/* WHAT I DO ? — 스크롤하면 앞으로 굴러 답이 적힌 면이 올라오는 큐브 */}
        <WhatIDo sectionRef={sectionRef} />

        {/* 큐브·원형 텍스트 자리 — 히어로에서 날아온 요소가 SharedDecor에 의해 여기에 앉는다 */}
        <Box
          data-anchor="cube-about"
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'absolute',
            left: 'calc(6% - 0.4cqw)',
            top: 'calc(50% - 0.4cqw)',
            width: '8.8cqw',
            height: '8.8cqw',
          }}
        />
        <Box
          data-anchor="circle-about"
          sx={{
            display: { xs: 'none', md: 'block' },
            position: 'absolute',
            left: '74%',
            top: '51%',
            width: '19.5cqw',
            height: '19.5cqw',
          }}
        />
      </FitStage>
    </Box>
  );
};

export default About;

import Box from '@mui/material/Box';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Contact from './components/Contact';
import SharedDecor from './components/SharedDecor';
import useSmoothScroll from './hooks/useSmoothScroll';

function App() {
  useSmoothScroll();

  return (
    <Box sx={{ bgcolor: '#ffffff' }}>
      <Header />
      <SharedDecor />
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Contact />
    </Box>
  );
}

export default App;

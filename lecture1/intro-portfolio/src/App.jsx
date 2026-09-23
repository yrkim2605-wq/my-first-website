import Box from '@mui/material/Box';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Skills from './components/Skills';
import Projects from './components/Projects';
import Contact from './components/Contact';

function App() {
  return (
    <Box sx={{ bgcolor: '#ffffff' }}>
      <Header />
      <Hero />
      <About />
      <Skills />
      <Projects />
      <Contact />
    </Box>
  );
}

export default App;

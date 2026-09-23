import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { aboutMeData as initialAboutMeData } from '../data/aboutMeData';
import { initialSkills, getTopSkills } from '../data/skillsData';

const SUMMARY_LENGTH = 100;
const HOME_SKILL_COUNT = 4;

const PortfolioContext = createContext(null);

export const usePortfolio = () => useContext(PortfolioContext);

export function PortfolioProvider({ children }) {
  const [basicInfo, setBasicInfo] = useState(initialAboutMeData.basicInfo);
  const [sections, setSections] = useState(initialAboutMeData.sections);
  const [skills, setSkills] = useState(initialSkills);

  const updatePhoto = useCallback((photoUrl) => {
    setBasicInfo((prev) => ({ ...prev, photo: photoUrl }));
  }, []);

  const updateSectionContent = useCallback((id, content) => {
    setSections((prev) =>
      prev.map((section) => (section.id === id ? { ...section, content } : section))
    );
  }, []);

  const updateSkillLevel = useCallback((id, level) => {
    setSkills((prev) => prev.map((skill) => (skill.id === id ? { ...skill, level } : skill)));
  }, []);

  const addSkill = useCallback((skill) => {
    setSkills((prev) => [...prev, { ...skill, id: Date.now() }]);
  }, []);

  const getHomeData = useCallback(() => {
    const content = sections
      .filter((section) => section.showInHome)
      .map((section) => ({
        id: section.id,
        title: section.title,
        summary:
          section.content.length > SUMMARY_LENGTH
            ? `${section.content.slice(0, SUMMARY_LENGTH)}...`
            : section.content,
      }));

    return {
      content,
      skills: getTopSkills(skills, HOME_SKILL_COUNT),
      basicInfo,
    };
  }, [sections, skills, basicInfo]);

  const value = useMemo(
    () => ({
      basicInfo,
      sections,
      skills,
      updatePhoto,
      updateSectionContent,
      updateSkillLevel,
      addSkill,
      getHomeData,
    }),
    [basicInfo, sections, skills, updatePhoto, updateSectionContent, updateSkillLevel, addSkill, getHomeData]
  );

  return <PortfolioContext.Provider value={value}>{children}</PortfolioContext.Provider>;
}

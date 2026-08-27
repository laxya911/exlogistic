'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type PageContextType = {
  title: string;
  subtitle: string;
  setTitle: (title: string) => void;
  setSubtitle: (subtitle: string) => void;
};

const PageContext = createContext<PageContextType>({
  title: '',
  subtitle: '',
  setTitle: () => {},
  setSubtitle: () => {}
});

export const PageProvider = ({ children }: { children: ReactNode }) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');

  return (
    <PageContext.Provider value={{ title, subtitle, setTitle, setSubtitle }}>
      {children}
    </PageContext.Provider>
  );
};

export const usePageHeader = () => useContext(PageContext);

export const PageHeaderUpdater = ({ title, subtitle }: { title: string, subtitle?: string }) => {
  const { setTitle, setSubtitle } = usePageHeader();
  useEffect(() => {
    setTitle(title);
    if (subtitle) setSubtitle(subtitle);
    else setSubtitle('');
  }, [title, subtitle, setTitle, setSubtitle]);
  return null;
};

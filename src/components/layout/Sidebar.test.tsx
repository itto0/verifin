import { describe, it, expect } from 'bun:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Sidebar, NavTab } from './Sidebar';

describe('Sidebar NavTab', () => {
  it('allows "lab" as a valid NavTab', () => {
    const tab: NavTab = 'lab';
    expect(tab).toBe('lab');
  });

  it('renders "Processing Lab" in the navigation item list with FlaskConical icon', () => {
    const html = renderToStaticMarkup(
      <Sidebar
        currentTab="dashboard"
        onSelectTab={() => {}}
        pendingCount={0}
        isOpenMobile={false}
        onCloseMobile={() => {}}
      />
    );

    expect(html).toContain('Processing Lab');
    expect(html).toContain('lucide-flask-conical');
  });

  it('highlights Processing Lab when currentTab is "lab"', () => {
    const html = renderToStaticMarkup(
      <Sidebar
        currentTab="lab"
        onSelectTab={() => {}}
        pendingCount={0}
        isOpenMobile={false}
        onCloseMobile={() => {}}
      />
    );

    expect(html).toContain('Processing Lab');
    expect(html).toContain('bg-[#2563EB]/10');
  });
});

import type { ReactNode } from 'react';
import './ContentBox.css';

interface ContentBoxProps {
  children: ReactNode;
  className?: string;
}

function ContentBox({ children, className = '' }: ContentBoxProps) {
  return <div className={`content-box ${className}`.trim()}>{children}</div>;
}

export default ContentBox;

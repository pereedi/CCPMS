import React from 'react';
import espLogo from '../../assets/esp-logo.png';

interface EspIconProps {
  style?: React.CSSProperties;
  className?: string;
  alt?: string;
}

export const EspIcon: React.FC<EspIconProps> = ({ style, className, alt = 'ESPEE Logo' }) => {
  return (
    <img
      src={espLogo}
      alt={alt}
      className={className}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        flexShrink: 0,
        objectFit: 'contain',
        width: '20px',
        height: '20px',
        ...style,
      }}
    />
  );
};

export default EspIcon;

import React from 'react';
import { View } from 'react-native';
import Svg, { Circle, Path, Text as SvgText, G } from 'react-native-svg';
import { WheelOption } from '../types';

interface WheelProps {
  options: WheelOption[];
  rotation: number;
  size: number;
  onPress?: () => void;
}

const Wheel: React.FC<WheelProps> = ({ options, rotation, size, onPress }) => {
  const WHEEL_SIZE = size;
  const CENTER = WHEEL_SIZE / 2;
  const RADIUS = CENTER - 10; // Padding for the wheel

  if (options.length === 0) {
    return null; // Empty state is handled in HomeScreen
  }

  const totalPercentage = options.reduce((sum, option) => sum + option.percentage, 0);
  let currentAngle = rotation;

  const sliceAngle = 2 * Math.PI / options.length;

  const createSlice = (option: WheelOption, index: number) => {
    // Eşit dilim açısı
    const startAngle = currentAngle;
    const endAngle = currentAngle + sliceAngle;

    // Dilim path'i oluştur
    const x1 = CENTER + RADIUS * Math.cos(startAngle);
    const y1 = CENTER + RADIUS * Math.sin(startAngle);
    const x2 = CENTER + RADIUS * Math.cos(endAngle);
    const y2 = CENTER + RADIUS * Math.sin(endAngle);

    const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;

    const pathData = [
      `M ${CENTER} ${CENTER}`,
      `L ${x1} ${y1}`,
      `A ${RADIUS} ${RADIUS} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      'Z',
    ].join(' ');

    // Metin pozisyonu
    const textAngle = startAngle + sliceAngle / 2;
    const textRadius = RADIUS * 0.7;
    const textX = CENTER + textRadius * Math.cos(textAngle);
    const textY = CENTER + textRadius * Math.sin(textAngle);

    currentAngle += sliceAngle;

    return (
      <G key={option.id}>
        <Path
          d={pathData}
          fill={option.color}
          stroke="#fff"
          strokeWidth={2}
        />
        <SvgText
          x={textX}
          y={textY}
          fontSize={18}
          fontWeight="bold"
          fill="#fff"
          textAnchor="middle"
          alignmentBaseline="middle"
          transform={`rotate(${(textAngle * 180) / Math.PI}, ${textX}, ${textY})`}
        >
          {option.text.length > 8 ? option.text.substring(0, 8) + '...' : option.text}
        </SvgText>
      </G>
    );
  };

  // İki ayrı yay için parametreler
  const brandLeft = 'DÖRTYOL';
  const brandRight = 'MARKET';
  const brandColors = [
    '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#fbbf24', '#f472b6', '#10b981'
  ];
  const arcRadius = RADIUS + 18;

  // Sol yay (DÖRTYOL)
  const arcStartLeft = -Math.PI / 1.15;
  const arcEndLeft = -Math.PI / 1.65;
  const arcAngleLeft = arcEndLeft - arcStartLeft;
  const brandLeftLetters = brandLeft.split('');
  const letterAngleStepLeft = arcAngleLeft / (brandLeftLetters.length - 1);

  // Sağ yay (MARKET)
  const arcStartRight = Math.PI / 1.65;
  const arcEndRight = Math.PI / 1.15;
  const arcAngleRight = arcEndRight - arcStartRight;
  const brandRightLetters = brandRight.split('');
  const letterAngleStepRight = arcAngleRight / (brandRightLetters.length - 1);

  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={WHEEL_SIZE} height={WHEEL_SIZE}>
        {options.map((option, index) => createSlice(option, index))}
        
        {/* Merkez daire */}
        <Circle
          cx={CENTER}
          cy={CENTER}
          r={25}
          fill="#fff"
          stroke="#333"
          strokeWidth={3}
        />
        
        {/* Merkez ikon */}
        <SvgText
          x={CENTER}
          y={CENTER}
          fontSize={20}
          textAnchor="middle"
          alignmentBaseline="middle"
        >
          🎰
        </SvgText>
      </Svg>
    </View>
  );
};

export default Wheel; 
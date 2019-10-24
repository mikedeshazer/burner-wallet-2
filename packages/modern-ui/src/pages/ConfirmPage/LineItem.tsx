import React from 'react';
import styled from 'styled-components';

const Line = styled.div`
  margin: 8px 0;
`;

const TextLineName = styled.div`
  font-size: 18;
  font-weight: bold;
`;

const TextLineValue = styled.div`
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 20px;
`;

interface LineItemProps {
  name: string;
  value: string;
}

const LineItem: React.FC<LineItemProps> = ({ name, value }) => (
  <Line>
    <TextLineName>{name}</TextLineName>
    <TextLineValue>{value}</TextLineValue>
  </Line>
);

export default LineItem;

import React, { ReactElement } from 'react';

export const PinModuleScriptData = (props: any): ReactElement => {
  const { elements } = props;
  return (
    <>
      {elements.scriptData({
        attrName: 'module',
      })}
    </>
  );
};

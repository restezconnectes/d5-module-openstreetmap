import React, { ReactElement } from 'react';

/**
 * OpenStreetMap module's script data component.
 *
 * @since 1.0.0
 *
 * @param {any} props React component props.
 *
 * @returns {ReactElement}
 */
export const ModuleScriptData = (props: any): ReactElement => {
  const { elements } = props;
  return (
    <>
      {elements.scriptData({
        attrName: 'module',
      })}
    </>
  );
};

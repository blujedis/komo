import React, { FC, Fragment } from 'react';

const JsonErrors: FC<{ errors: any }> = ({ errors }) => {
  if (!Object.keys(errors).length)
    return null;
  return (
    <Fragment>
      <h3>Current Errors</h3>
      <pre style={{ color: 'red' }}>{JSON.stringify(errors, null, 2)}</pre>
    </Fragment>
  );
};

export default JsonErrors;

import React, { FC } from 'react';
import { Route, Router } from 'wouter';
import Default from './default';
import User from './user';
import Material from './material';
import Menu from './menu';
import Advanced from './advanced';

const App: FC = () => {

  return (
    <Router>
      <div style={{ padding: '24px' }} >
        <div>
          <Menu />
        </div>
        <Route path="/" component={Default} />
        <Route path="/user" component={User} />
        <Route path="/material" component={Material} />
        <Route path="/advanced" component={Advanced} />
      </div>
    </Router>
  );

};

export default App;

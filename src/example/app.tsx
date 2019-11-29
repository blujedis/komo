import React, { FC } from 'react';
import { Route, Router, Switch } from 'wouter';
import Default from './default';
import User from './user';
import Material from './material';
import Menu from './menu';
import Advanced from './advanced';
import Virtual from './virtual';
import Reinit from './reinit';

const NotFound: FC = (props) => {
  return (
    <div>
      404 - Not Found
    </div>
  );
};

const App: FC = () => {

  return (
    <Router>
      <div style={{ padding: '24px' }} >
        <div>
          <Menu />
        </div>
        <Switch>
          <Route path="/" component={Default} />
          <Route path="/user" component={User} />
          <Route path="/material" component={Material} />
          <Route path="/advanced" component={Advanced} />
          <Route path="/virtual" component={Virtual} />
          <Route path="/reinit" component={Reinit} />
          <Route path="/:404*" component={NotFound} />
        </Switch>
      </div>
    </Router>
  );

};

export default App;

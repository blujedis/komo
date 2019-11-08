import React, { FC } from 'react';
import { Link } from 'wouter';

const Menu: FC = () => {
  return (
    <div>
      <Link href="/" >Default</Link>&nbsp;&nbsp;|&nbsp;&nbsp;
      <Link href="/user" >User Validation</Link>&nbsp;&nbsp;|&nbsp;&nbsp;
      <Link href="/material" >Material Design</Link>&nbsp;&nbsp;|&nbsp;&nbsp;
      <Link href="/advanced" >Advanced</Link>
    </div>
  );
};

export default Menu;

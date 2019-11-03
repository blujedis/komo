import React, { FC } from 'react';
import { Link, useRouter } from 'wouter';
import useLocation from "wouter/use-location";

const Menu: FC = () => {
  const r = useLocation();
  // console.log(r);
  return (
    <div>
      <Link href="/" >Default</Link>&nbsp;&nbsp;|&nbsp;&nbsp;
      <Link href="/user" >User Validation</Link>&nbsp;&nbsp;|&nbsp;&nbsp;
      <Link href="/material" >Material Design</Link>
    </div>
  );
};

export default Menu;

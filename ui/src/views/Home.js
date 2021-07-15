import React, { useState, useEffect } from "react";

import {
  Link,
  Route,
  Switch,
  useParams,
  useRouteMatch,
} from "react-router-dom";

import CardGame from "../components/CardGame";

export default function Home() {
  let { path, url } = useRouteMatch();

  return (
    <>
      <CardGame />
    </>
  );
}

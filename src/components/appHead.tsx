import { Component, Html } from "@kitajs/html"

export const AppHead: Component<{ title: string }> = ({ title, children }) => (
  <head>
    <meta charset="UTF-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>{title}</title>
    <link rel="stylesheet" href="/css/app.css"/>
    <link rel="icon" href="/icons/favicon.png" type="image/png"/>
    {children}
  </head>
)
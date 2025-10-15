import React from "react";

export const Label: React.FC<{ children: React.ReactNode }> = ({ children }) =>
  <span className="label">{children}</span>;

export const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) =>
  <input className="input" {...props} />;

export const Select: React.FC<React.SelectHTMLAttributes<HTMLSelectElement>> = (props) =>
  <select className="select" {...props} />;

export const BtnPrimary: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> =
  ({ children, ...rest }) => <button className="btn btnPrimary" {...rest}>{children}</button>;

export const BtnGhost: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> =
  ({ children, ...rest }) => <button className="btn btnGhost" {...rest}>{children}</button>;

export const BtnDanger: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> =
  ({ children, ...rest }) => <button className="btn btnDanger" {...rest}>{children}</button>;

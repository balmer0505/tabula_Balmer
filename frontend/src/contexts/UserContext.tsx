import { createContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

// export const TokenContext = createContext();

export const TokenContext = createContext<any>(null);


// TODO Context necista un Provider el cual se encargue de poder
// guardar y retornar la informacion que guardemos en context
export const TokenProvider = (props) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const idLoading = (idLoading: boolean) => {
    console.log("🔄 Cambiando loading a:", idLoading);
    setLoading(idLoading);
  };

  return (
    <TokenContext.Provider
      value={{
        loading,
        idLoading,
      }}
    >
      {props.children}
    </TokenContext.Provider>
  );
};

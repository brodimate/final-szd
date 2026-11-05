import { createContext, useState, useContext } from "react";

export const SearchContext = createContext();

export function SearchProvider({ children }) {
  const [filters, setFilters] = useState({
    q: "",
    from: "",
    to: "",
  });

  return (
    <SearchContext.Provider value={{ filters, setFilters }}>
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  return useContext(SearchContext);
}

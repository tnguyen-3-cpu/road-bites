import { useState, useEffect, useCallback, useRef } from "react";
import { Keyboard } from "react-native";
import { useDebounce } from "./useDebounce";
import { autocomplete, getPlaceDetails } from "../api/googlePlaces";

function generateSessionToken() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function usePlacesAutocomplete() {
  const [text, setText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);
  const sessionTokenRef = useRef(null);

  const debouncedText = useDebounce(text, 300);

  // Ensure a session token exists, creating one if needed
  const getSessionToken = useCallback(() => {
    if (!sessionTokenRef.current) {
      sessionTokenRef.current = generateSessionToken();
    }
    return sessionTokenRef.current;
  }, []);

  // Fetch suggestions when debounced text changes
  useEffect(() => {
    // Skip if text is too short, or a place is already selected
    if (debouncedText.length < 2 || selectedPlace) {
      setSuggestions([]);
      return;
    }

    let cancelled = false;

    (async () => {
      setIsLoading(true);
      try {
        const data = await autocomplete(debouncedText, getSessionToken());
        if (cancelled) return;
        if (data.suggestions?.length) {
          setSuggestions(
            data.suggestions
              .filter((s) => s.placePrediction)
              .map((s) => {
                const p = s.placePrediction;
                return {
                  placeId: p.placeId,
                  description: p.text?.text || "",
                  mainText: p.structuredFormat?.mainText?.text || p.text?.text || "",
                  secondaryText: p.structuredFormat?.secondaryText?.text || "",
                };
              })
          );
        } else {
          setSuggestions([]);
        }
      } catch {
        if (!cancelled) setSuggestions([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [debouncedText, selectedPlace, getSessionToken]);

  const handleSelect = useCallback(
    async (suggestion) => {
      setText(suggestion.description);
      setSuggestions([]);
      setIsLoading(true);
      Keyboard.dismiss();

      try {
        const coordinate = await getPlaceDetails(
          suggestion.placeId,
          getSessionToken()
        );
        if (coordinate) {
          setSelectedPlace({
            placeId: suggestion.placeId,
            description: suggestion.description,
            coordinate,
          });
        }
      } catch {
        // Geocoding failed — selection stays null
      } finally {
        setIsLoading(false);
        // End the billing session — discard the token
        sessionTokenRef.current = null;
      }
    },
    [getSessionToken]
  );

  // When user edits text after a selection, clear the selection
  const handleTextChange = useCallback(
    (newText) => {
      setText(newText);
      if (selectedPlace) {
        setSelectedPlace(null);
      }
    },
    [selectedPlace]
  );

  const clearSelection = useCallback(() => {
    setText("");
    setSuggestions([]);
    setSelectedPlace(null);
    sessionTokenRef.current = null;
  }, []);

  return {
    text,
    setText: handleTextChange,
    suggestions,
    isLoading,
    selectedPlace,
    handleSelect,
    clearSelection,
  };
}

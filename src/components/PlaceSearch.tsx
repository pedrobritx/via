"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { Translator } from "@/i18n";
import type { MessageKey } from "@/i18n";
import type { Place } from "@/domain/types";

interface PlaceSearchProps {
  labelKey: MessageKey;
  placeholderKey: MessageKey;
  helpKey?: MessageKey;
  value: Place | null;
  onChange: (place: Place | null) => void;
  t: Translator;
  required?: boolean;
}

/**
 * Campo de busca de lugar com lista de sugestões.
 *
 * Implementa o padrão combobox da WAI-ARIA à mão em vez de trazer uma
 * biblioteca: são cerca de sessenta linhas, e o comportamento de teclado
 * (setas, Enter, Escape) fica sob nosso controle em vez de depender de como
 * um pacote de terceiros decidiu tratar foco.
 */
export function PlaceSearch({
  labelKey,
  placeholderKey,
  helpKey,
  value,
  onChange,
  t,
  required,
}: PlaceSearchProps) {
  const inputId = useId();
  const listId = `${inputId}-list`;
  const helpId = `${inputId}-help`;

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Place[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Busca curta demais não vale requisição. Derivamos a lista visível em vez de
  // zerar `results` dentro do efeito: setState síncrono no corpo de um efeito
  // dispara uma renderização em cascata.
  const queryIsSearchable = query.trim().length >= 2;
  const visibleResults = queryIsSearchable ? results : [];

  // Busca com atraso, para não disparar uma requisição por tecla.
  useEffect(() => {
    if (!queryIsSearchable) return;

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/geocode?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const data = (await response.json()) as { places?: Place[] };
        setResults(data.places ?? []);
        setActiveIndex(-1);
      } catch {
        // Busca abortada ou falha de rede: a lista simplesmente não abre.
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, queryIsSearchable]);

  // Fecha a lista ao clicar fora.
  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  function select(place: Place) {
    onChange(place);
    setQuery("");
    setResults([]);
    setOpen(false);
    setActiveIndex(-1);
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || visibleResults.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((i) => (i + 1) % visibleResults.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((i) => (i <= 0 ? visibleResults.length - 1 : i - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      select(visibleResults[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div className="flex flex-col gap-1.5" ref={containerRef}>
      <label htmlFor={inputId} className="text-sm font-medium">
        {t(labelKey)}
        {required ? (
          <span aria-hidden="true" className="text-burden">
            {" *"}
          </span>
        ) : null}
      </label>

      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-md border border-primary bg-primary-soft px-3 py-2">
          <span className="text-sm">
            <span className="sr-only">{t("form.selected")}: </span>
            {value.label}
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            className="shrink-0 rounded px-2 py-1 text-xs font-medium underline underline-offset-2 hover:no-underline"
          >
            {t("form.clear")}
          </button>
        </div>
      ) : (
        <div className="relative">
          <input
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={open && visibleResults.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={
              activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined
            }
            aria-describedby={helpKey ? helpId : undefined}
            autoComplete="off"
            placeholder={t(placeholderKey)}
            value={query}
            onChange={(e) => {
              const next = e.target.value;
              setQuery(next);
              setOpen(true);
              // O estado de carregamento nasce aqui, no manipulador de evento,
              // e não dentro do efeito.
              setLoading(next.trim().length >= 2);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
          />

          {open && queryIsSearchable ? (
            <ul
              id={listId}
              role="listbox"
              className="absolute z-20 mt-1 max-h-64 w-full overflow-auto rounded-md border border-line bg-surface shadow-lg"
            >
              {loading ? (
                <li className="px-3 py-2 text-sm text-muted">
                  {t("form.searching")}
                </li>
              ) : visibleResults.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted">
                  {t("form.noResults")}
                </li>
              ) : (
                visibleResults.map((place, index) => (
                  <li
                    key={`${place.lat},${place.lng},${place.label}`}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={index === activeIndex}
                  >
                    <button
                      type="button"
                      onClick={() => select(place)}
                      onMouseEnter={() => setActiveIndex(index)}
                      className={`w-full px-3 py-2 text-left text-sm ${
                        index === activeIndex ? "bg-primary-soft" : ""
                      }`}
                    >
                      {place.label}
                    </button>
                  </li>
                ))
              )}
            </ul>
          ) : null}
        </div>
      )}

      {helpKey ? (
        <p id={helpId} className="text-xs text-muted">
          {t(helpKey)}
        </p>
      ) : null}
    </div>
  );
}

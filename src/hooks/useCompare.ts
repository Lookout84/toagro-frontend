import { useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store";
import {
  addToCompare,
  removeFromCompare,
  clearCompare,
} from "../store/uiSlice";
import { Listing } from "../store/catalogSlice";
import { toast } from "react-toastify";

const MAX_COMPARE_ITEMS = 3;

/**
 * Хук для управління порівнянням товарів
 */
function useCompare() {
  const dispatch = useAppDispatch();
  const compareItems = useAppSelector((state) => state.ui.compareItems);
  const [compareListings, setCompareListings] = useState<Listing[]>([]);

  // Додавання товару до порівняння
  const addItem = useCallback(
    (listing: Listing) => {
      if (compareItems.length >= MAX_COMPARE_ITEMS) {
        toast.warning(
          `Ви можете порівняти максимум ${MAX_COMPARE_ITEMS} позиції`,
        );
        return false;
      }

      if (compareItems.includes(listing.id)) {
        return false; // Товар вже в списку порівняння
      }

      dispatch(addToCompare(listing.id));

      // Додаємо товар до списку порівняння
      setCompareListings((prev) => [...prev, listing]);

      toast.success(`${listing.title} додано до порівняння`);
      return true;
    },
    [compareItems, dispatch],
  );

  // Видалення товару з порівняння
  const removeItem = useCallback(
    (listingId: number) => {
      dispatch(removeFromCompare(listingId));

      // Видаляємо товар зі списку порівняння
      setCompareListings((prev) =>
        prev.filter((listing) => listing.id !== listingId),
      );

      toast.info("Товар видалено з порівняння");
      return true;
    },
    [dispatch],
  );

  // Очищення списку порівняння
  const clearItems = useCallback(() => {
    dispatch(clearCompare());
    setCompareListings([]);

    toast.info("Список порівняння очищено");
    return true;
  }, [dispatch]);

  // Перевірка, чи товар є в списку порівняння
  const isItemInCompare = useCallback(
    (listingId: number) => {
      return compareItems.includes(listingId);
    },
    [compareItems],
  );

  // Перемикання стану порівняння для товару
  const toggleCompare = useCallback(
    (listing: Listing) => {
      if (isItemInCompare(listing.id)) {
        return removeItem(listing.id);
      } else {
        return addItem(listing);
      }
    },
    [isItemInCompare, removeItem, addItem],
  );

  return {
    compareItems,
    compareListings,
    addItem,
    removeItem,
    clearItems,
    isItemInCompare,
    toggleCompare,
    MAX_COMPARE_ITEMS,
  };
}

export default useCompare;

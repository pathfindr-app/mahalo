# MapSearchBar Popper Persistence Fix

## Problem

The search suggestions Popper in `MapSearchBar.js` was disappearing prematurely, specifically:
1.  After typing a search term that yielded results, the Popper would sometimes close automatically even though the user hadn't clicked away.
2.  Clicking on a suggestion item sometimes didn't register because the input field lost focus (`blur`) before the click event handler could run.

## Solution

The fix involved refining how the focus and blur events are handled for the search input and the Popper component to ensure the Popper remains visible until the user explicitly interacts outside of the search context (input field or suggestions list).

Key changes implemented in `src/components/map/MapSearchBar.js`:

1.  **Container Blur Handling:**
    *   An `onBlur` event handler (`handleContainerBlur`) was added to the main `Box` container that wraps both the `TextField` (input) and the `Popper`.
    *   `handleContainerBlur` checks `event.relatedTarget`. This property indicates where the focus is moving *to*.
    *   If `event.relatedTarget` is `null` (focus lost to the document body) or points to an element *outside* the main container (`!event.currentTarget.contains(event.relatedTarget)`), it means the user has clicked or tabbed away from the search component. Only then is `setAnchorEl(null)` called to hide the Popper.
    *   The previous `setTimeout` within the blur handler was removed (or commented out) as direct state updates are generally preferred if they work reliably.

2.  **Preventing Blur on Popper Click:**
    *   An `onMouseDown` event handler (`handlePopperMouseDown`) was added directly to the `Popper` component.
    *   This handler simply calls `event.preventDefault()`. This crucial step prevents the `TextField` from losing focus when the user clicks down *anywhere* within the Popper area (including the background padding or scrollbar). This ensures that subsequent `onClick` events on the `ListItemButton`s within the Popper can fire correctly.

3.  **Anchor Element Management:**
    *   `handleInputChange`: Modified to set `anchorEl` (which shows the Popper) only if it's not already set. It *no longer* sets `anchorEl` to `null` when the search query becomes too short; the `handleContainerBlur` logic now manages closing.
    *   `handleFocus`: Sets `anchorEl` when the input gains focus, ensuring the Popper appears if the user clicks back into the input field. It also now triggers an immediate search if the field already contains a valid query upon focusing.
    *   `handleSelectSuggestion`: Sets `anchorEl` to `null` *after* a suggestion is selected to close the Popper.

4.  **Simplified Popper `open` State:**
    *   The `open` prop for the `Popper` is now determined by `Boolean(anchorEl) && (suggestions.length > 0 || isLoading || error)`. It's open if the anchor is set *and* there's something to display (suggestions, loading indicator, or an error message).

5.  **Using `ListItemButton`:**
    *   Suggestion items were changed from `ListItem` to `ListItemButton` for better semantics, accessibility, and built-in visual feedback (ripple effect) on interaction.

These changes ensure the Popper's visibility is tied directly to whether the user is actively engaged with the search input or the suggestion list itself, providing a more intuitive user experience. 
import { useEffect, useRef } from "react";
import { useSoundsStore } from "@/sounds/sounds-store";
import { useI18n } from "@/i18n/use-i18n";

const TOP_SOUNDS_PAGE_SIZE = 50;
const SEARCH_PAGE_SIZE = 20;
const DEFAULT_COMMERCIAL_ONLY = true;

export function useSoundSearch({
	query,
	commercialOnly,
}: {
	query: string;
	commercialOnly: boolean;
}) {
	const { editorT } = useI18n();
	const previousQueryRef = useRef(query);
	const topCommercialFilterRef = useRef(DEFAULT_COMMERCIAL_ONLY);
	const {
		topSoundEffects,
		searchResults,
		isSearching,
		searchError,
		currentPage,
		hasNextPage,
		isLoadingMore,
		totalCount,
		hasLoaded,
		setTopSoundEffects,
		setLoading,
		setError,
		setSearchResults,
		setSearching,
		setSearchError,
		setLastSearchQuery,
		setCurrentPage,
		setHasNextPage,
		setTotalCount,
		setLoadingMore,
		appendSearchResults,
		appendTopSounds,
		resetPagination,
	} = useSoundsStore();

	const loadMore = async () => {
		if (isLoadingMore || !hasNextPage) return;

		try {
			setLoadingMore({ loading: true });
			const nextPage = currentPage + 1;
			const isSearch = Boolean(query.trim());
			const searchParams = new URLSearchParams({
				page: nextPage.toString(),
				page_size: (isSearch
					? SEARCH_PAGE_SIZE
					: TOP_SOUNDS_PAGE_SIZE
				).toString(),
				type: "effects",
				commercial_only: commercialOnly.toString(),
			});

			if (isSearch) {
				searchParams.set("q", query);
			} else {
				searchParams.set("sort", "downloads");
			}

			const response = await fetch(
				`/api/sounds/search?${searchParams.toString()}`,
			);

			if (response.ok) {
				const data = await response.json();

				if (isSearch) {
					appendSearchResults({ results: data.results });
				} else {
					appendTopSounds({ results: data.results });
				}

				setCurrentPage({ page: nextPage });
				setHasNextPage({ hasNext: !!data.next });
				setTotalCount({ count: data.count });
			} else {
				console.error("Failed to load more sounds:", response.status);
				setSearchError({ error: editorT.sounds.loadFailed });
			}
		} catch (error) {
			console.error("Failed to load more sounds:", error);
			setSearchError({ error: editorT.sounds.loadFailed });
		} finally {
			setLoadingMore({ loading: false });
		}
	};

	useEffect(() => {
		const previousQuery = previousQueryRef.current;
		previousQueryRef.current = query;

		if (!query.trim()) {
			setSearchResults({ results: [] });
			setSearchError({ error: null });
			setLastSearchQuery({ query: "" });

			const returningToTop = Boolean(previousQuery.trim());
			const filterChanged = topCommercialFilterRef.current !== commercialOnly;
			if (!hasLoaded || (!returningToTop && !filterChanged)) {
				return;
			}

			let ignore = false;
			resetPagination();

			const timeoutId = setTimeout(async () => {
				try {
					setLoading({ loading: true });
					setError({ error: null });
					const searchParams = new URLSearchParams({
						page: "1",
						page_size: TOP_SOUNDS_PAGE_SIZE.toString(),
						type: "effects",
						sort: "downloads",
						commercial_only: commercialOnly.toString(),
					});
					const response = await fetch(
						`/api/sounds/search?${searchParams.toString()}`,
					);

					if (ignore) return;
					if (!response.ok) {
						throw new Error(`Failed to fetch: ${response.status}`);
					}

					const data = await response.json();
					setTopSoundEffects({ sounds: data.results });
					setCurrentPage({ page: 1 });
					setHasNextPage({ hasNext: !!data.next });
					setTotalCount({ count: data.count });
					topCommercialFilterRef.current = commercialOnly;
				} catch (error) {
					if (!ignore) {
						console.error("Failed to refresh top sounds:", error);
						setError({ error: editorT.sounds.loadFailed });
					}
				} finally {
					if (!ignore) {
						setLoading({ loading: false });
					}
				}
			}, 100);

			return () => {
				ignore = true;
				clearTimeout(timeoutId);
			};
		}

		let ignore = false;
		const timeoutId = setTimeout(async () => {
			try {
				setSearching({ searching: true });
				setSearchError({ error: null });
				resetPagination();

				const searchParams = new URLSearchParams({
					q: query,
					type: "effects",
					page: "1",
					page_size: SEARCH_PAGE_SIZE.toString(),
					commercial_only: commercialOnly.toString(),
				});
				const response = await fetch(
					`/api/sounds/search?${searchParams.toString()}`,
				);

				if (!ignore) {
					if (response.ok) {
						const data = await response.json();
						setSearchResults({ results: data.results });
						setLastSearchQuery({ query });
						setHasNextPage({ hasNext: !!data.next });
						setTotalCount({ count: data.count });
						setCurrentPage({ page: 1 });
					} else {
						console.error("Failed to search sounds:", response.status);
						setSearchError({ error: editorT.sounds.loadFailed });
					}
				}
			} catch (error) {
				if (!ignore) {
					console.error("Failed to search sounds:", error);
					setSearchError({ error: editorT.sounds.loadFailed });
				}
			} finally {
				if (!ignore) {
					setSearching({ searching: false });
				}
			}
		}, 300);

		return () => {
			clearTimeout(timeoutId);
			ignore = true;
		};
	}, [
		query,
		commercialOnly,
		hasLoaded,
		setTopSoundEffects,
		setLoading,
		setError,
		setSearchResults,
		setSearching,
		setSearchError,
		setLastSearchQuery,
		setCurrentPage,
		setHasNextPage,
		setTotalCount,
		resetPagination,
		editorT.sounds.loadFailed,
	]);

	return {
		results: searchResults,
		isLoading: isSearching,
		error: searchError,
		loadMore,
		hasNextPage,
		isLoadingMore,
		totalCount,
		topSoundEffects,
	};
}

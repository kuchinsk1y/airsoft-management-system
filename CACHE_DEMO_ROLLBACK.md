# Demo Cache Rollback Note

Date: 2026-05-07

Temporary demo mode was applied to make web changes appear immediately after reload.

## What was changed

### Web: switched to no-store
- apps/web/src/actions/products.ts
- apps/web/src/actions/cities.ts
- apps/web/src/actions/news.ts
- apps/web/src/actions/workshop-items.ts
- apps/web/src/actions/gallery.ts
- apps/web/src/actions/ratings.ts
- apps/web/src/components/Header/HeaderWrapper.tsx
- apps/web/src/components/Footer/FooterWrapper.tsx
- apps/web/src/app/layout.tsx

### API: public Cache-Control switched to no-store
- apps/api/src/products/products.controller.ts
- apps/api/src/cities/cities.controller.ts
- apps/api/src/gallery/gallery.controller.ts
- apps/api/src/news/news.controller.ts
- apps/api/src/organization/organization.controller.ts
- apps/api/src/workshop-items/workshop-items.controller.ts
- apps/api/src/events/events.controller.ts
- apps/api/src/ratings/ratings.controller.ts

## After demo
Restore previous TTL-based caching in these files:
- Next fetch revalidate values on web side
- Cache-Control s-maxage/stale-while-revalidate on API side

## Exact values to restore

### Web (Next fetch)
- apps/web/src/actions/products.ts
	- restore: next: { revalidate: 300 }
	- locations: getProducts, getProduct, getProductBySlug
- apps/web/src/actions/cities.ts
	- restore: next: { revalidate: 900 }
	- locations: getCities
- apps/web/src/actions/news.ts
	- restore:
		- getNewsList: search mode cache: no-store, non-search mode next: { revalidate: 120 }
		- getNewsBySlug: next: { revalidate: 120 }
		- getAdjacentNewsBySlug: next: { revalidate: 120 }
- apps/web/src/actions/workshop-items.ts
	- restore:
		- getWorkshopItemList: search mode cache: no-store, non-search mode next: { revalidate: 120 }
		- getWorkshopItemBySlug: next: { revalidate: 120 }
- apps/web/src/actions/gallery.ts
	- restore: next: { revalidate: 30 }
	- locations: getCompanyGalleryPhotos, getEventGalleryPhotos
- apps/web/src/actions/ratings.ts
	- restore in fetchApi:
		- public mode: next: { revalidate: 60 }
		- private mode: cache: no-store
- apps/web/src/components/Header/HeaderWrapper.tsx
	- restore: next: { revalidate: 300 }
- apps/web/src/components/Footer/FooterWrapper.tsx
	- restore: next: { revalidate: 300 }
- apps/web/src/app/layout.tsx
	- restore: next: { revalidate: 60 } for organization fetch in structured data

### API (Cache-Control headers)
- apps/api/src/products/products.controller.ts
	- restore PRODUCTS_CACHE_CONTROL: public, s-maxage=300, stale-while-revalidate=900
- apps/api/src/cities/cities.controller.ts
	- restore CITIES_CACHE_CONTROL: public, s-maxage=900, stale-while-revalidate=3600
- apps/api/src/gallery/gallery.controller.ts
	- restore GALLERY_CACHE_CONTROL: public, s-maxage=30, stale-while-revalidate=60
- apps/api/src/news/news.controller.ts
	- restore NEWS_CACHE_CONTROL: public, s-maxage=120, stale-while-revalidate=600
- apps/api/src/organization/organization.controller.ts
	- restore ORGANIZATION_CACHE_CONTROL: public, s-maxage=300, stale-while-revalidate=900
- apps/api/src/workshop-items/workshop-items.controller.ts
	- restore WORKSHOP_ITEMS_CACHE_CONTROL: public, s-maxage=120, stale-while-revalidate=600
- apps/api/src/events/events.controller.ts
	- restore EVENTS_CACHE_CONTROL: public, s-maxage=15, stale-while-revalidate=60
- apps/api/src/ratings/ratings.controller.ts
	- restore RATINGS_CACHE_CONTROL: public, s-maxage=60, stale-while-revalidate=300
	- restore RATINGS_STATIC_CACHE_CONTROL: public, s-maxage=900, stale-while-revalidate=3600

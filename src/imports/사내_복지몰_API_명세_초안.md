# 사내 복지몰 API 명세 초안

## 1. 개요
- Base URL: `/api/v1`
- 인증: 사내 SSO 또는 게이트웨이 인증 후 `userId`, `role` 컨텍스트를 서버에 전달한다고 가정
- 포맷: `application/json`
- 시간 포맷: ISO 8601 UTC 저장, 화면에는 로컬 타임존 변환
- 공통 응답 형식:

```json
{
  "success": true,
  "data": {},
  "meta": {}
}
```

- 공통 에러 형식:

```json
{
  "success": false,
  "error": {
    "code": "POINT_BALANCE_NOT_ENOUGH",
    "message": "사용 가능한 복지 포인트가 부족합니다."
  }
}
```

## 2. 인증 / 권한

### 권한 규칙
- `employee`: 사용자 기능 API 접근 가능
- `admin`: 사용자 기능 + 관리자 기능 API 접근 가능

### 권장 공통 헤더
- `X-Request-Id`: 요청 추적용
- `Idempotency-Key`: 충전, 주문 생성, 포인트 조정 같은 멱등 처리용

## 3. 사용자 API

### 3.1 내 정보 조회
`GET /me`

응답 예시
```json
{
  "success": true,
  "data": {
    "id": "usr_001",
    "employeeNo": "E240001",
    "name": "홍길동",
    "email": "hong@example.com",
    "status": "active",
    "roles": ["employee"]
  }
}
```

### 3.2 내 포인트 잔액 조회
`GET /me/points/balance`

응답 필드
- `availablePoint`
- `reservedPoint`
- `expiringPoint`
- `expiringAt`

### 3.3 내 포인트 이력 조회
`GET /me/points/ledgers?page=1&size=20&type=grant,use,refund,recharge`

응답 필드
- `ledgerId`
- `type`
- `amount`
- `balanceAfter`
- `relatedOrderId`
- `description`
- `createdAt`

### 3.4 포인트 충전 요청
`POST /me/point-recharges`

요청 바디
```json
{
  "amount": 50000,
  "paymentMethod": "card"
}
```

검증
- 최소/최대 충전 금액
- 허용 결제 수단인지 확인

응답 필드
- `rechargeOrderId`
- `status`
- `paymentRedirectUrl`

### 3.5 충전 완료 콜백
`POST /point-recharges/callback`

설명
- PG 또는 내부 결제 시스템에서 호출
- 멱등 처리 필수

## 4. 카테고리 / 상품 API

### 4.1 카테고리 목록 조회
`GET /categories`

### 4.2 상품 목록 조회
`GET /products?categoryId=cat_001&query=커피&sort=popular&page=1&size=20`

응답 필드
- `productId`
- `name`
- `thumbnailUrl`
- `pointPrice`
- `status`
- `stockStatus`
- `badge`

### 4.3 상품 상세 조회
`GET /products/{productId}`

응답 필드
- `productId`
- `name`
- `description`
- `images`
- `pointPrice`
- `variants`
- `deliveryInfo`
- `stockStatus`
- `purchaseLimit`

### 4.4 추천 상품 조회
`GET /products/recommendations`

## 5. 장바구니 API

### 5.1 장바구니 조회
`GET /cart`

응답 필드
- `cartId`
- `items`
- `totalPointAmount`

### 5.2 장바구니 담기
`POST /cart/items`

요청 바디
```json
{
  "productId": "prd_001",
  "variantId": "var_001",
  "quantity": 2
}
```

검증
- 상품 활성 상태
- 옵션 유효성
- 재고 부족 여부

### 5.3 장바구니 수량 변경
`PATCH /cart/items/{cartItemId}`

요청 바디
```json
{
  "quantity": 3
}
```

### 5.4 장바구니 삭제
`DELETE /cart/items/{cartItemId}`

## 6. 주문 API

### 6.1 주문 생성
`POST /orders/checkout`

요청 바디
```json
{
  "cartItemIds": ["ci_001", "ci_002"],
  "shippingAddressId": "addr_001",
  "agreePolicy": true
}
```

서버 처리
- 장바구니 가격 재계산
- 재고 검증
- 포인트 잔액 검증
- 주문 생성
- 포인트 예약
- 재고 예약
- 성공 시 `paid` 상태로 확정

응답 필드
- `orderId`
- `orderNo`
- `status`
- `usedPoint`

### 6.2 주문 목록 조회
`GET /orders?status=paid,shipped&from=2026-01-01&to=2026-12-31&page=1&size=20`

### 6.3 주문 상세 조회
`GET /orders/{orderId}`

응답 필드
- `orderId`
- `orderNo`
- `status`
- `items`
- `usedPoint`
- `shipment`
- `statusHistories`
- `cancelAvailable`
- `returnAvailable`

### 6.4 주문 취소 요청
`POST /orders/{orderId}/cancel-request`

요청 바디
```json
{
  "reason": "단순 변심"
}
```

검증
- `paid`, `preparing` 상태만 허용
- 이미 취소/반품 중인 주문 차단

### 6.5 주문 반품 요청
`POST /orders/{orderId}/return-request`

요청 바디
```json
{
  "reason": "상품 하자"
}
```

검증
- `shipped`, `delivered` 상태만 허용
- 반품 가능 기간 내 여부 확인

## 7. 배송지 API

### 7.1 배송지 목록 조회
`GET /me/shipping-addresses`

### 7.2 배송지 등록
`POST /me/shipping-addresses`

요청 바디
```json
{
  "recipientName": "홍길동",
  "phone": "010-1234-5678",
  "zipCode": "12345",
  "address1": "서울시 강남구 ...",
  "address2": "101동 1201호",
  "isDefault": true
}
```

### 7.3 배송지 수정
`PATCH /me/shipping-addresses/{addressId}`

### 7.4 배송지 삭제
`DELETE /me/shipping-addresses/{addressId}`

## 8. 관리자 API

### 8.1 대시보드 요약 조회
`GET /admin/dashboard`

응답 필드
- `userCount`
- `activeProductCount`
- `todayOrderCount`
- `todayUsedPoint`
- `pendingCancelCount`
- `lowStockCount`

### 8.2 임직원 목록 조회
`GET /admin/users?query=홍길동&status=active&page=1&size=20`

### 8.3 임직원 상세 조회
`GET /admin/users/{userId}`

### 8.4 포인트 일괄 지급 생성
`POST /admin/point-grant-batches`

요청 바디
```json
{
  "batchKey": "2026-annual-grant",
  "amount": 300000,
  "targetStatus": "active",
  "expiresAt": "2026-12-31T14:59:59Z",
  "description": "2026 연간 복지 포인트 지급"
}
```

검증
- `batchKey` 중복 금지
- 동일 사용자 중복 지급 금지

### 8.5 사용자 포인트 수동 조정
`POST /admin/users/{userId}/point-adjustments`

요청 바디
```json
{
  "type": "adjust_add",
  "amount": 10000,
  "reason": "CS 보상"
}
```

검증
- `adjust_sub` 시 잔액 부족 차단
- 사유 필수

### 8.6 상품 등록
`POST /admin/products`

요청 바디
```json
{
  "name": "프리미엄 커피 세트",
  "categoryId": "cat_001",
  "pointPrice": 25000,
  "description": "원두 3종 세트",
  "status": "draft",
  "sourceType": "internal"
}
```

### 8.7 상품 수정
`PATCH /admin/products/{productId}`

### 8.8 상품 상태 변경
`POST /admin/products/{productId}/status`

요청 바디
```json
{
  "status": "active"
}
```

### 8.9 재고 조정
`POST /admin/products/{productId}/inventory-adjustments`

요청 바디
```json
{
  "variantId": "var_001",
  "delta": 100,
  "reason": "초기 입고"
}
```

### 8.10 주문 목록 조회
`GET /admin/orders?status=paid&query=20260325&page=1&size=20`

### 8.11 주문 상세 조회
`GET /admin/orders/{orderId}`

### 8.12 주문 상태 변경
`PATCH /admin/orders/{orderId}/status`

요청 바디
```json
{
  "status": "preparing"
}
```

검증
- 허용된 상태 전이만 가능

### 8.13 배송 정보 등록
`POST /admin/orders/{orderId}/shipment`

요청 바디
```json
{
  "carrier": "CJ대한통운",
  "trackingNo": "1234567890"
}
```

### 8.14 취소 요청 승인
`POST /admin/orders/{orderId}/cancel-approve`

### 8.15 취소 요청 반려
`POST /admin/orders/{orderId}/cancel-reject`

요청 바디
```json
{
  "reason": "이미 출고가 시작되었습니다."
}
```

### 8.16 반품 요청 승인
`POST /admin/orders/{orderId}/return-approve`

### 8.17 반품 요청 반려
`POST /admin/orders/{orderId}/return-reject`

## 9. 외부 연동 API

### 9.1 제휴사 목록 조회
`GET /admin/partners`

### 9.2 제휴사 동기화 실행
`POST /admin/partners/{partnerId}/sync`

### 9.3 제휴사 동기화 이력 조회
`GET /admin/partners/{partnerId}/sync-histories`

## 10. 주요 에러 코드
- `AUTH_REQUIRED`
- `FORBIDDEN`
- `USER_NOT_ACTIVE`
- `POINT_BALANCE_NOT_ENOUGH`
- `POINT_EXPIRED`
- `PRODUCT_NOT_ACTIVE`
- `PRODUCT_SOLD_OUT`
- `INVALID_VARIANT`
- `ORDER_STATUS_NOT_ALLOWED`
- `CANCEL_NOT_ALLOWED`
- `RETURN_NOT_ALLOWED`
- `DUPLICATE_BATCH_KEY`
- `DUPLICATE_CALLBACK`
- `IDEMPOTENCY_CONFLICT`

## 11. 권장 상태값

### 사용자 상태
- `active`
- `inactive`
- `leave`

### 상품 상태
- `draft`
- `active`
- `inactive`
- `sold_out`

### 주문 상태
- `created`
- `paid`
- `preparing`
- `shipped`
- `delivered`
- `cancel_requested`
- `cancelled`
- `return_requested`
- `returned`

### 포인트 원장 타입
- `grant`
- `recharge`
- `reserved`
- `use`
- `refund`
- `adjust_add`
- `adjust_sub`
- `expire`

## 12. 구현 메모
- 주문 생성, 포인트 예약, 재고 예약은 하나의 트랜잭션으로 처리하는 것이 안전하다.
- 충전 콜백, 배치 지급, 관리자 포인트 조정은 모두 멱등성 키를 두는 편이 좋다.
- 주문 상세 응답에는 화면에서 버튼 제어가 가능하도록 `cancelAvailable`, `returnAvailable` 같은 계산 필드를 포함하는 것이 좋다.
- 관리자 목록성 API는 프론트 작업 효율을 위해 `query`, `status`, `page`, `size`, `sort` 파라미터 규칙을 통일하는 것이 좋다.

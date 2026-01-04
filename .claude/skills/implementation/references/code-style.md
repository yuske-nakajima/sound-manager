# コーディング規約

このプロジェクトのコーディング規約とベストプラクティス。

## TypeScript

### 型定義
```typescript
// ✅ Good: interface を使う
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Good: 合成は type alias を使う
type UserWithRole = User & {
  role: 'admin' | 'user';
};

// ❌ Bad: any は使わない
const data: any = fetchData(); // 禁止
```

### 型安全性
```typescript
// ✅ Good: 型を明示
function getUserName(user: User): string {
  return user.name;
}

// ✅ Good: Generics を活用
function getValue<T>(key: string): T | undefined {
  // ...
}

// ❌ Bad: 暗黙の any
function process(data) { // 禁止
  // ...
}
```

## React

### コンポーネント
```typescript
// ✅ Good: 関数コンポーネント + TypeScript
interface Props {
  title: string;
  onClose: () => void;
}

const Modal: React.FC<Props> = ({ title, onClose }) => {
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={onClose}>Close</button>
    </div>
  );
};
```

### Hooks
```typescript
// ✅ Good: 型を指定
const [count, setCount] = useState<number>(0);
const [user, setUser] = useState<User | null>(null);
```

## エラーハンドリング

### API呼び出し
```typescript
// ✅ Good: エラーハンドリングを実装
async function fetchUser(id: string): Promise<User> {
  try {
    const response = await fetch(`/api/users/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
}
```

### try-catch の適切な使用
```typescript
// ✅ Good: 適切なエラーメッセージ
try {
  const result = await processData(data);
  return result;
} catch (error) {
  if (error instanceof ValidationError) {
    throw new Error('入力データが不正です');
  }
  throw new Error('データ処理中にエラーが発生しました');
}
```

## セキュリティ

### 環境変数の使用
```typescript
// ✅ Good: 環境変数を使用
const apiKey = process.env.API_KEY;

// ❌ Bad: ハードコーディング禁止
const apiKey = 'sk-1234567890abcdef'; // 絶対禁止
```

### データ削除の確認
```typescript
// ✅ Good: ユーザー確認を取る
async function deleteUser(userId: string, confirmed: boolean) {
  if (!confirmed) {
    throw new Error('削除には確認が必要です');
  }
  await db.users.delete(userId);
}

// ❌ Bad: 確認なしで削除
async function deleteUser(userId: string) {
  await db.users.delete(userId); // 危険
}
```

## ファイル構成

### ファイルサイズ
- 1ファイルは **200行以内** を目安
- 超える場合は責務ごとに分割

### ファイル分割例
```
# Before (500行)
UserManagement.tsx

# After
UserManagement.tsx (100行) - メインコンポーネント
UserForm.tsx (80行) - フォーム
UserList.tsx (70行) - リスト表示
useUserData.ts (50行) - カスタムフック
types.ts (30行) - 型定義
```

## 命名規則

### 変数・関数
```typescript
// ✅ Good: わかりやすい名前
const userCount = users.length;
function calculateTotalPrice(items: Item[]): number { }

// ❌ Bad: 不明瞭な名前
const n = users.length;
function calc(x: Item[]): number { }
```

### コンポーネント
```typescript
// ✅ Good: PascalCase
const UserProfile: React.FC = () => { };
const ProductList: React.FC = () => { };

// ❌ Bad
const userprofile: React.FC = () => { };
```

## テスト

### テストファイル命名
```
src/
  components/
    UserProfile.tsx
    UserProfile.test.tsx  # ✅ Good
```

### テストケース
```typescript
describe('UserProfile', () => {
  it('ユーザー名を表示する', () => {
    // Arrange
    const user = { id: '1', name: 'John' };

    // Act
    render(<UserProfile user={user} />);

    // Assert
    expect(screen.getByText('John')).toBeInTheDocument();
  });

  it('ユーザーがいない場合はエラーメッセージを表示', () => {
    // ...
  });
});
```

## コメント

### 適切なコメント
```typescript
// ✅ Good: 複雑なロジックの説明
// NOTE: ユーザーが管理者の場合のみ削除可能
if (user.role === 'admin') {
  // ...
}

// ❌ Bad: 自明なコメント
// ユーザーカウントをインクリメント
userCount++; // 不要
```

## パフォーマンス

### React のメモ化
```typescript
// ✅ Good: 不要な再レンダリングを防ぐ
const MemoizedComponent = React.memo(ExpensiveComponent);

const memoizedValue = useMemo(() => {
  return expensiveCalculation(data);
}, [data]);

const memoizedCallback = useCallback(() => {
  doSomething(a, b);
}, [a, b]);
```

## リファクタリング

### マーティン・ファウラーの手法に従う
- **Extract Method**: 長いメソッドを分割
- **Extract Variable**: 複雑な式を変数に抽出
- **Rename**: わかりやすい名前に変更
- **Remove Dead Code**: 使われていないコードを削除

## プロジェクト固有のルール

### 一時ファイル
- `.tmp/` ディレクトリに配置
- Git管理下に含めない

### インポート順序
```typescript
// 1. 外部ライブラリ
import React from 'react';
import { useState } from 'react';

// 2. 内部モジュール
import { Button } from '@/components/Button';
import { useAuth } from '@/hooks/useAuth';

// 3. 型定義
import type { User } from '@/types';

// 4. スタイル
import styles from './styles.module.css';
```

---

**常にこの規約を参照し、一貫性のあるコードを書くこと。**

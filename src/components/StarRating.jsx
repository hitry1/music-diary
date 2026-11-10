// 별점 — readOnly 면 보여 주기만, 아니면 눌러서 고른다
export default function StarRating({ value, onChange, readOnly = false }) {
  return (
    <div className={'stars' + (readOnly ? ' readonly' : '')} role={readOnly ? 'img' : 'radiogroup'} aria-label={`별점 ${value}점`}>
      {[1, 2, 3, 4, 5].map((n) =>
        readOnly ? (
          <span key={n} className={n <= value ? 'on' : ''}>★</span>
        ) : (
          <button type="button" key={n} className={n <= value ? 'on' : ''} onClick={() => onChange(n)} aria-label={`${n}점`}>★</button>
        ),
      )}
    </div>
  )
}

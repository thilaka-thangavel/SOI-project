from app import app

client = app.test_client()

results = []

def test(label, path, expect_html=False, expect_key=None):
    r = client.get(path)
    ok = r.status_code == 200
    if expect_html:
        ok = ok and (b'<!DOCTYPE' in r.data or b'<html' in r.data or b'<div id=' in r.data)
    if expect_key and r.is_json:
        ok = ok and expect_key in r.json
    results.append((ok, label, r.status_code))
    print(('  OK  ' if ok else ' FAIL ') + label + '  [' + str(r.status_code) + ']')

# Frontend routes — should serve React HTML
test('/ (Homepage)', '/', expect_html=True)
test('/risk-map (React route)', '/risk-map', expect_html=True)
test('/analytics (React route)', '/analytics', expect_html=True)
test('/inspections (React route)', '/inspections', expect_html=True)

# API routes — should return JSON
test('/api/health', '/api/health', expect_key='status')
test('/api/dashboard/summary', '/api/dashboard/summary', expect_key='locations_monitored')
test('/api/risk-assessments', '/api/risk-assessments')
test('/api/analytics', '/api/analytics', expect_key='rainfall_vs_incidents')
test('/api/data-sources', '/api/data-sources', expect_key='sources')
test('/api/inspections', '/api/inspections')
test('/api/rainfall', '/api/rainfall')
test('/api/drainage', '/api/drainage')
test('/api/reports', '/api/reports')

passed = sum(1 for ok, _, _ in results if ok)
total = len(results)
print()
print(str(passed) + '/' + str(total) + ' tests passed')
print('ALL TESTS PASSED' if passed == total else str(total - passed) + ' FAILED')

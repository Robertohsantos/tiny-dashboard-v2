#!/bin/bash
echo "=== Validation Hooks Status Check ==="
echo ""
echo "1. Environment Variables:"
grep -E "VALIDATION|validated" .env.local | grep -v "^#"
echo ""
echo "2. Redis Status:"
docker ps | grep redis-validation || echo "Redis não está rodando"
echo ""
echo "3. Server Status:"
curl -s -o /dev/null -w "Dashboard: HTTP %{http_code}\n" http://localhost:3000/dashboard-vendas
curl -s -o /dev/null -w "Monitor: HTTP %{http_code}\n" http://localhost:3000/admin/validation-monitor
echo ""
echo "4. Validation Config:"
if [ -f validation.config.json ]; then
    cat validation.config.json | jq -r '.enabled, .percentage' | xargs printf "Enabled: %s\nPercentage: %s%%\n"
else
    echo "Config file not found"
fi
echo ""
echo "=== End Status Check ==="

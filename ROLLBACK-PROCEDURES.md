# 🚨 Rollback Procedures - Validated Hooks Migration

## Quick Rollback Commands

### ⚡ IMMEDIATE ROLLBACK (Emergency)

```bash
# Stop validation immediately
echo "NEXT_PUBLIC_USE_VALIDATED_HOOKS=false" >> .env.local
echo "NEXT_PUBLIC_VALIDATION_ROLLOUT_PERCENTAGE=0" >> .env.local

# Restart server
npm run dev
```

### 🔄 GRADUAL ROLLBACK (Recommended)

```bash
# Reduce percentage gradually
echo "NEXT_PUBLIC_VALIDATION_ROLLOUT_PERCENTAGE=50" >> .env.local  # From 100% to 50%
# Wait 30 minutes, monitor
echo "NEXT_PUBLIC_VALIDATION_ROLLOUT_PERCENTAGE=10" >> .env.local  # From 50% to 10%
# Wait 30 minutes, monitor
echo "NEXT_PUBLIC_USE_VALIDATED_HOOKS=false" >> .env.local        # Disable completely
```

## Rollback Scenarios

### Scenario 1: High Error Rate (>2%)

#### Symptoms

- Error rate spike in monitoring dashboard
- User complaints about functionality
- Console errors in browser

#### Actions

1. **Immediate Response**

   ```bash
   # Enable fallback immediately
   echo "NEXT_PUBLIC_VALIDATION_FALLBACK=true" >> .env.local
   echo "NEXT_PUBLIC_AUTO_ROLLBACK_ENABLED=true" >> .env.local
   echo "NEXT_PUBLIC_AUTO_ROLLBACK_THRESHOLD=0.02" >> .env.local
   ```

2. **Investigate**

   ```bash
   # Check validation monitor
   open http://localhost:3000/admin/validation-monitor

   # Check Redis for error patterns
   docker exec -it $(docker ps -qf "name=redis") redis-cli
   > KEYS validation:*
   > GET validation:errors:dashboard
   ```

3. **Rollback if needed**
   ```bash
   # Disable validation for affected component
   echo "NEXT_PUBLIC_VALIDATION_ENABLED_COMPONENTS=produtos" >> .env.local
   ```

### Scenario 2: Performance Degradation

#### Symptoms

- Page load times > 3 seconds
- Validation time > 10ms consistently
- Memory usage spikes

#### Actions

1. **Reduce Load**

   ```bash
   # Lower rollout percentage
   echo "NEXT_PUBLIC_VALIDATION_ROLLOUT_PERCENTAGE=10" >> .env.local
   ```

2. **Monitor Metrics**

   ```bash
   # Run health check
   tsx scripts/health-check-validation.ts

   # Check performance metrics
   curl http://localhost:3000/api/monitoring/validation | jq '.performance'
   ```

3. **Optimize or Rollback**
   ```bash
   # If optimization not possible, disable
   echo "NEXT_PUBLIC_USE_VALIDATED_HOOKS=false" >> .env.local
   ```

### Scenario 3: Complete System Failure

#### Symptoms

- Application won't start
- White screen of death
- Build failures

#### Actions

1. **Emergency Rollback**

   ```bash
   # Restore backup configuration
   cp .env.local.backup-* .env.local

   # Or create minimal config
   cat > .env.local << EOF
   NEXT_PUBLIC_USE_VALIDATED_HOOKS=false
   NEXT_PUBLIC_VALIDATION_ENABLED=false
   NEXT_PUBLIC_VALIDATION_ROLLOUT_PERCENTAGE=0
   EOF
   ```

2. **Clear Cache**

   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   npm run dev
   ```

3. **Verify Recovery**
   ```bash
   # Test basic functionality
   curl http://localhost:3000 -I
   curl http://localhost:3000/dashboard-vendas -I
   curl http://localhost:3000/produtos -I
   ```

## Rollback Verification Checklist

### ✅ Post-Rollback Verification

1. **System Health**

   - [ ] Application starts without errors
   - [ ] All pages load correctly
   - [ ] No console errors in browser
   - [ ] API endpoints responding

2. **Functionality**

   - [ ] Dashboard displays data
   - [ ] Products page works
   - [ ] Filters and interactions work
   - [ ] Data updates correctly

3. **Performance**

   - [ ] Page load < 2 seconds
   - [ ] No memory leaks
   - [ ] CPU usage normal

4. **Monitoring**
   - [ ] Error rate back to baseline (<0.1%)
   - [ ] No validation errors in logs
   - [ ] Redis telemetry stopped/cleared

### 📊 Metrics to Monitor Post-Rollback

```bash
# Check error rates
curl http://localhost:3000/api/monitoring/validation | jq '.errorRate'

# Check active validations
curl http://localhost:3000/api/monitoring/validation | jq '.activeValidations'

# Clear Redis telemetry
docker exec -it $(docker ps -qf "name=redis") redis-cli FLUSHDB
```

## Communication Protocol

### Internal Team Communication

1. **Immediate Notification**

   ```markdown
   🚨 ROLLBACK INITIATED - Validated Hooks

   Time: [TIMESTAMP]
   Reason: [High error rate | Performance | System failure]
   Action: [Rollback to 0% | Reduced to X%]
   Impact: [None | Minor | Major]
   ETA for resolution: [TIME]
   ```

2. **Status Updates (Every 30 min)**

   ```markdown
   📊 ROLLBACK STATUS UPDATE

   Current State: [Rolled back | Partially active]
   Error Rate: [X%]
   Performance: [Normal | Degraded]
   Next Steps: [Investigation | Fix deployment]
   ```

3. **Resolution Report**

   ```markdown
   ✅ ROLLBACK COMPLETE

   Duration: [TIME]
   Root Cause: [DESCRIPTION]
   Fix Applied: [DESCRIPTION]
   Lessons Learned: [POINTS]
   ```

### Stakeholder Communication

For Product/Business Teams:

```markdown
Subject: Temporary Feature Rollback - No User Impact

We've temporarily disabled a backend optimization to ensure system stability.

- User Experience: No change
- Data: All safe and intact
- Timeline: Resolution within [TIME]
```

## Recovery Procedures

### After Fixing Issues

1. **Re-enable Gradually**

   ```bash
   # Start with 1% to test fix
   echo "NEXT_PUBLIC_USE_VALIDATED_HOOKS=true" >> .env.local
   echo "NEXT_PUBLIC_VALIDATION_ROLLOUT_PERCENTAGE=1" >> .env.local

   # Monitor for 1 hour
   tsx scripts/health-check-validation.ts

   # If stable, increase
   echo "NEXT_PUBLIC_VALIDATION_ROLLOUT_PERCENTAGE=10" >> .env.local
   ```

2. **Full Recovery Steps**

   - 1% → Monitor 1 hour
   - 10% → Monitor 2 hours
   - 50% → Monitor 4 hours
   - 100% → Monitor 24 hours

3. **Document Lessons Learned**

   ```bash
   # Create incident report
   cat > incidents/$(date +%Y%m%d)-validation-rollback.md << EOF
   # Incident Report - Validation Rollback

   Date: $(date)
   Duration: [TIME]
   Impact: [DESCRIPTION]

   ## Timeline
   - [TIME]: Issue detected
   - [TIME]: Rollback initiated
   - [TIME]: System stable

   ## Root Cause
   [DESCRIPTION]

   ## Resolution
   [DESCRIPTION]

   ## Prevention
   [ACTION ITEMS]
   EOF
   ```

## Emergency Contacts

### Technical Team

- **Lead Developer**: Check Slack #dev-critical
- **DevOps**: Check PagerDuty
- **On-Call**: Check schedule in wiki

### Escalation Path

1. Try immediate rollback (5 min)
2. Contact on-call developer (10 min)
3. Escalate to tech lead (15 min)
4. Emergency team meeting (30 min)

## Prevention Measures

### Pre-Rollout Checklist

- [ ] Run health check: `tsx scripts/health-check-validation.ts`
- [ ] Run integration tests: `npm run validation:test:integration`
- [ ] Check monitoring dashboard
- [ ] Verify rollback procedures
- [ ] Team notification sent

### Monitoring Setup

```bash
# Set up alerts
curl -X POST http://localhost:3000/api/monitoring/rollback-alert \
  -H "Content-Type: application/json" \
  -d '{
    "errorThreshold": 0.02,
    "performanceThreshold": 10,
    "notificationChannels": ["slack", "email"]
  }'
```

## Quick Reference Card

```
🚨 EMERGENCY ROLLBACK
────────────────────
echo "NEXT_PUBLIC_USE_VALIDATED_HOOKS=false" >> .env.local
npm run dev

📊 CHECK STATUS
────────────────
tsx scripts/health-check-validation.ts
open http://localhost:3000/admin/validation-monitor

🔄 GRADUAL ROLLBACK
────────────────────
Current% → 50% → 10% → 0%
Wait 30min between each step

✅ VERIFY RECOVERY
────────────────────
curl http://localhost:3000 -I
Check browser console
Monitor error rates

📞 ESCALATION
────────────────
1. Rollback (5 min)
2. On-call dev (10 min)
3. Tech lead (15 min)
4. Team meeting (30 min)
```

---

**Last Updated**: 2025-09-22
**Document Version**: 1.0
**Owner**: Development Team
**Review Cycle**: After each incident

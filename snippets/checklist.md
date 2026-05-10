Before pointing Stripe at production, I want to know five things:

- [ ] The route receives events locally
- [ ] The correct webhook secret is being used
- [ ] The raw body is verified before parsing
- [ ] Important event types have been tested
- [ ] Duplicate events are handled safely

let reqack;
XMLHttpRequest = new Proxy(XMLHttpRequest, {
	construct(target, argumentsList, newTarget) {
		return new Proxy(new target(...argumentsList), {
			get(target, property, receiver) {
				const req = target;
				let ret = target[property];
				if (typeof ret === 'function') ret = ret.bind(target);
				if (property === 'open') return new Proxy(ret, {
					apply(target, thisArg, argumentsList) {
						req.argsopen = argumentsList;
						return Reflect.apply(target, thisArg, argumentsList);
					}
				});
				if (property === 'send') return new Proxy(ret, {
					apply(target, thisArg, argumentsList) {
						const url = (req.argsopen||[])[1];
						if (typeof url==='string' && url.match(/api\/v9\/channels\/.*\/messages\/.*\/ack/)) {
							const body = argumentsList[0];
							if (typeof body!=='string' || !body.match(/"manual":true/)) {
								reqack = req;
								reqack.argssend = argumentsList;
								const spacer = document.querySelector('[class^=scrollerSpacer]');
								if (!spacer || spacer.nextElementSibling) return;
								const e = document.createElement('button');
								e.textContent = 'Mark as read';
								e.style.backgroundColor = 'var(--brand-500)';
								e.style.borderRadius = '8px 8px 0 0';
								e.style.boxShadow = 'var(--elevation-low)';
								e.style.color = 'var(--white-500)';
								e.style.cursor = 'pointer';
								e.style.fontFamily = 'var(--font-primary)';
								e.style.marginBottom = '10px';
								e.style.padding = '6px 0';
								e.style.width = '100%';
								e.addEventListener('click', () => {
									reqack.addEventListener('readystatechange', () => {
										if (reqack.readyState!==4 || reqack.status!==200) return;
										e.remove();
										const bar = window['---new-messages-bar'];
										if (bar) bar.remove();
									});
									reqack.send(...reqack.argssend);
								});
								spacer.after(e);
								return;
							}
						}
						return Reflect.apply(target, thisArg, argumentsList);
					}
				});
				return ret;
			}
		});
	}
});

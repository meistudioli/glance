var init;

init = {
	data: {},
	ens: {},
	callBack: function(target, inViewport) {
		var paused;
		paused = init.ens.video.paused;

		if (inViewport) {
			if (init.ens.video.parentNode != init.ens.containerIrens) init.ens.containerIrens.appendChild(init.ens.video);
			init.ens.container.classList.remove('hide')
			init.ens.perspective.classList.add('hide');
		} else {
			if (init.ens.video.parentNode != init.ens.perspectiveIrens) init.ens.perspectiveIrens.appendChild(init.ens.video);
			init.ens.container.classList.add('hide')
			init.ens.perspective.classList.remove('hide');
		}//end if
		if (!paused && init.ens.video.paused) {
			init.ens.video.muted = true;
			init.ens.video.play();
			init.ens.video.muted = false;
		}//end if
	},
	ready: function() {
		this.ens.container = document.querySelector('.defult-container');
		this.ens.containerIrens = document.querySelector('.defult-container .irens');
		this.ens.perspective = document.querySelector('.perspective');
		this.ens.perspectiveIrens = document.querySelector('.perspective .irens');
		this.ens.video = document.querySelector('video');

		navigator.glance('add', this.ens.container, init.callBack);
	}
};

function pageInit() {
	init.ready();
}
/*programed by mei(李維翰), http://www.facebook.com/mei.studio.li*/
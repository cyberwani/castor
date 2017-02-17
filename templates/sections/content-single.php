<?php Development::storeTemplatePath( __FILE__ ); ?>

<article <?php post_class(); ?>>
	<header>
		<h1 class="entry-title"><?= get_the_title(); ?></h1>
		<?php get_template_part( 'partials/entry-meta' ); ?>
	</header>
	<div class="entry-content">
		<?php the_content(); ?>
	</div>
	<footer>
		<?php get_template_part( 'partials/prevnext', 'single' ); ?>
	</footer>
	<?php comments_template( '/templates/partials/comments.php' ); ?>
</article>

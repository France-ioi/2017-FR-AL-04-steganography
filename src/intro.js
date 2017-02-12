import React from 'react';
import EpicComponent from 'epic-component';

export const IntroVersion1 = EpicComponent(self => {

  self.render = function () {
    return (
      <div className="taskInstructions">
        <h1>Stéganographie 1</h1>

        <h2>Méthode utilisée pour cacher un message</h2>

        <p>La stéganographie est l'art de cacher un message au sein d'un texte, d’une image, d’une chanson etc. Dans cet exercice, un nombre à 8 chiffres est caché au sein d'une image de la manière suivante :</p>
        <p>Le nombre à 8 chiffres a été écrit noir sur blanc dans une image que l’on appellera <strong>Image secrète</strong>. On a par ailleurs choisi une image colorée de mêmes dimensions appelée <strong>Image 1</strong> dans l’exercice.</p>

        <p>On a ensuite caché le contenu de l’image secrète au sein de l’image colorée : pour chaque pixel noir de l’image secrète on a modifié légèrement la quantité de rouge du pixel situé à la même position dans l’image colorée. Par contre, les pixels de l’image colorée correspondant aux pixels blanc n’ont pas été modifiés.</p>

        <p>L’image obtenue ressemble ainsi de très près à l’image colorée d’origine, avec de toutes petites différences presque indécelables à l’oeil nu, sur la composante rouge des pixels correspondant aux chiffres du message caché. Sans l’image d’origine (image 1)  pour comparer, il est très difficile d’y déceler un message.</p>

        <h2>Représentation des images sur l’ordinateur</h2>

        <p>Chaque image est une grille formée de petits carrés appelés pixels. Dans cet exercice chaque image contient 400x400 pixels.</p>

        <p>La couleur de chaque pixel est représentée par trois nombres indiquant la quantité de rouge, de vert et de bleu. Chaque quantité est  un nombre entre  0 et 255. Par exemple un pixel rouge a une quantité de rouge de 255, une quantité de vert de 0 et toujours 0 pour bleu, donc on le représente par (255,0,0). De la même façon un pixel bleu est représenté par  (0, 0, 255). Un pixel représenté par (128, 128, 128) contient une quantité égale  de rouge, de vert et de bleu, et tous à moitié de l’intensité maximale, ce qui donne la couleur grise.</p>

        <p>Lorsque l’on fait une transformation sur un pixel dans ce sujet, on le fait composante par composante. Par exemple pour ajouter 1 à la composante rouge d’un pixel P1, sans dépasser 255, et stocker le pixel obtenu dans la variable résultat, on écrit :</p>
        <ul>
          <li>resultat.rouge = min(255, P1.rouge + 1)</li>
          <li>resultat.vert = P1.vert</li>
          <li>resultat.bleu = P1.bleu</li>
        </ul>

        <p>L’expression resultat.rouge = min(255, P1.rouge + 1) ci-dessus signifie que l’on prend la valeur de la composante rouge du pixel P1, que l’on ajoute 1, puis qu’on prend le minimum entre 255 et cette valeur (pour ne jamais dépasser 255). Enfin, on stocke la valeur obtenue dans la composante rouge du pixel resultat.</p>

        <h2>Utilisation des outils</h2>

        <p>Dans cet exercice, on vous fournit un ensemble d’outils de manipulation d’images. Certains outils s’appliquent sur une seule image et permettent d’en obtenir le négatif, d’en extraire une composante, ou d’augmenter sa luminosité, tandis que d’autres outils s’appliquent sur deux images, et permettent d’en calculer la moyenne ou bien leur différence.</p>

        <p>Pour créer une nouvelle image transformée, choisissez un outil dans la liste déroulante, puis sélectionnez une ou deux images sur lesquelles l’appliquer : choisissez une image dans la liste sur le côté gauche, puis cliquez sur le bouton “Modifier” sous une des vignettes de l’outil. Vous pouvez alors choisir un nom pour l’image qui sera créée, puis cliquer sur le bouton enregistrer pour l’ajouter à votre liste d’images.</p>

        <h2>Ce qui vous est donné</h2>

        <p>Vous disposez de l’image colorée (Image 1) d’origine et de l’image dans laquelle on a caché le nombre de 8 chiffres (Image 2).</p>

        <h2>Ce qui vous est demandé</h2>

        <p>Votre but est d’utiliser les différents outils à votre disposition pour faire apparaître l’image secrète. Cela vous permettra de fournir votre réponse, constituée des 8 chiffres de ce message.</p>
      </div>
    );
  };

});

export const IntroVersion2 = EpicComponent(self => {
  self.render = function () {
    return (
      <div className="taskInstructions">
        <h1>Stéganographie 2</h1>
        <p>Ce sujet est basé sur les mêmes principes que le sujet Stéganographie 1, qu’il est souhaitable de résoudre au préalable.</p>

        <h2>Ce qui vous est donné</h2>

        <p>On a appliqué quatre fois la méthode de Stéganographie 1 pour cacher quatre nombres à 8 chiffres chacun : chaque nombre a été écrit noir sur blanc dans une image secrète puis caché dans une image colorée. Dans ce deuxième exercice de stéganographie, on ne vous donne plus l’image colorée d’origine. Ce que vous savez en revanche est que l’image colorée est la même dans les quatre cas.</p>

        <p>En cryptographie, il est toujours dangereux d’utiliser la même clé plusieurs fois, car on peut alors comparer plusieurs messages chiffrés et en faire certaines déductions sur le contenu des messages ou de la clé. Le principe est le même en stéganographie : réutiliser la même image d’origine pour y cacher plusieurs messages donne un moyen de retrouver ce message même si l’on ne dispose pas de l’image colorée.</p>

        <h2>Ce qui vous est demandé</h2>

        <p>Votre objectif est donc d’exploiter le fait que la même image colorée a été utilisée 4 fois, et de  faire apparaître  une image où l’on distingue le nombre caché dans la première image (Image 1). Sans être parfaitement lisible, cette image doit être suffisamment claire pour que vous puissiez déterminer quels sont les 8 chiffres qui y sont cachés et qui constituent la réponse attendue.</p>

      </div>
    );
  };
});

export default EpicComponent(self => {
  self.render = function () {
    const {version, baseUrl} = self.props;
    switch (version) {
      case 1: return <IntroVersion1 baseUrl={baseUrl}/>;
      case 2: return <IntroVersion2 baseUrl={baseUrl}/>;
      default: return false;
    }
  };
});

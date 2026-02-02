describe('DevDecks smoke tests', () => {
  it('loads landing page', () => {
    cy.visit('/landing');
    cy.get('body').should('be.visible');
  });

  it('loads home page', () => {
    cy.visit('/home');
    cy.get('body').should('be.visible');
  });
});

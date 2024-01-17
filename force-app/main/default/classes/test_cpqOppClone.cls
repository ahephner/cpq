@isTest
public class test_cpqOppClone {
    @isTest()
    static void test_cpqOppClone(){
        PageReference pref = Page.oppCloneWithProducts;
        Test.setCurrentPage(pref);
        //date for opp
        Date myDate = Date.newInstance(2040, 1, 4);
		//create test customer
        Account cust = new Account();
        cust.Name = 'Test123456';
        cust.Type = 'Customer';
        cust.Customer_Name__c = 'Test Customer 123456';
        insert cust;
        //product creation
        Id pricebookId = Test.getStandardPricebookId();

        //create product2 that is active
        product2 prod = new product2(name ='product', IsActive= True); 
        insert prod; 
        
        PricebookEntry pbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=prod.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        insert pbe; 
//create product2 that will be deactivated
        product2 widget = new product2(name ='widget', IsActive= True, Agency_Pricing__c=true); 
        insert widget; 
        
        PricebookEntry widgetpbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=widget.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        insert widgetpbe; 
 //normal product
         product2 rake = new product2(name ='rake', IsActive= True, Agency_Pricing__c=false); 
        insert rake; 
        
        PricebookEntry rakepbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=rake.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        insert rakepbe;  
 //zero margin
        product2 shovel = new product2(name ='shovel', IsActive= True, Agency_Pricing__c=false); 
        insert shovel; 
        
        PricebookEntry shovelpbe = new PricebookEntry(Pricebook2Id = pricebookId, Product2Id=shovel.id,
                                                 unitprice=4, IsActive = True, UseStandardPrice=False);
        insert shovelpbe; 
        //create test opportunity
        opportunity opp = new opportunity(name = 'test name', accountID= cust.id, pricebook2id = pricebookId,
                                         stagename='Estimate(10%)', job_type__c = 'Construction', closedate = myDate, Order_Type__c='EOP');
       
        //insert w/o synced quote
        insert opp; 
       
//opportunitylineitem
        opportunitylineitem li = new opportunitylineitem(opportunityid = opp.id, product2id = prod.Id, PricebookEntryId=pbe.id,
                                                         unitprice= 4, quantity= 3, CPQ_Unit_Price__c= 4, CPQ_Margin__c=100); 
        insert li; 
        opportunitylineitem widgetli = new opportunitylineitem(opportunityid = opp.id, product2id = widget.Id, PricebookEntryId=widgetpbe.id,
                                                         unitprice= 4, quantity= 3, CPQ_Unit_Price__c = 4, CPQ_Margin__c=0.00); 
        insert widgetli;
        
        opportunitylineitem rakeli = new opportunitylineitem(opportunityid = opp.id, product2id = widget.Id, PricebookEntryId=rakepbe.id,
                                                          unitprice= 4, quantity= 3, CPQ_Unit_Price__c = 4, CPQ_Margin__c=10); 
        insert rakeli; 
        
        opportunitylineitem shovelli = new opportunitylineitem(opportunityid = opp.id, product2id = widget.Id, PricebookEntryId=shovelpbe.id,
                                                          unitprice= 4, quantity= 3, CPQ_Unit_Price__c = 4, CPQ_Margin__c=0.00); 
        insert shovelli;  
        //construct standard controller
        ApexPages.StandardController con = new ApexPages.StandardController(opp);
        
        //create the controller
        cpqOppClone clone = new cpqOppClone(con);
        
		Test.startTest();
            //call the clonemethod
            PageReference method = clone.cloneOpp();
            widget.IsActive = false; 
            update widget;
        	string eopClone = cpqOppClone.cloneOppEOP(opp.id, 'Yes'); 
        
            opportunity clonedOp = [select id from opportunity where id =: clone.newOppID];
			system.debug('eopClone ===> '+eopClone); 
            system.assertNotEquals(clonedOp, null); 

         test.stopTest();       
    }
}